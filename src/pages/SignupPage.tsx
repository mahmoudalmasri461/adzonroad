import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import PasswordField from '../components/PasswordField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Link as RouterLink } from 'react-router-dom';
import Logo from '../components/Logo';
import ImageUploadField from '../components/ImageUploadField';
import { ImageTooLargeError, toCompressedBase64 } from '../services/imageUpload';
import {
  carYears,
  CAR_TYPES,
  fetchRegions,
  PLATE_CHARACTERS,
  registerAdvertiser,
  registerDriver,
  registerTaxiCompany,
  RegistrationError,
  type RegionOption,
  type RegistrationResult,
  type SignupRole,
} from '../services/registration';
import { tokens } from '../theme';

function isSignupRole(value: string | null): value is SignupRole {
  return value === 'advertiser' || value === 'driver' || value === 'taxiCompany';
}

const YEARS = carYears();

/**
 * The three account types, and everything that changes with them.
 *
 * `value` stays `taxiCompany` while the label reads "Fleet Partner". The role is a backend
 * identifier — it picks the endpoint in `submitFor` and travels in the login URL — so it is
 * renamed on screen only. Renaming the value would have meant an API and database change to alter
 * a word in the interface.
 */
const ROLES = [
  {
    value: 'advertiser',
    label: 'Advertiser',
    description: 'Launch and manage advertising campaigns.',
    cta: 'Create advertiser account',
    review: 'We’ll review your business account before campaign access is activated.',
    submittedNote: 'We’ll let you know when your advertiser account is ready.',
  },
  {
    value: 'driver',
    label: 'Driver',
    description: 'Drive with AdzOnRoad and earn from participating.',
    cta: 'Create driver account',
    review: 'We’ll review your registration before your driver account is activated.',
    submittedNote: 'We’ll let you know when your driver account is ready.',
  },
  {
    value: 'taxiCompany',
    label: 'Fleet Partner',
    description: 'Connect and manage eligible vehicles in your fleet.',
    cta: 'Create fleet partner account',
    review: 'We’ll review your company before fleet access is activated.',
    submittedNote: 'We’ll let you know when your fleet account is ready.',
  },
] as const;

/** The chain the brand panel draws. Four words, no figures attached to any of them. */
const NETWORK_FLOW = ['Campaign', 'Vehicle', 'Location', 'Delivery'] as const;

const PANEL_BG = '#FAF8F4';

/**
 * Inputs are 50px with an 11px radius, rather than the theme's taller default and 14px corners.
 * A registration form is the longest stack of fields in the product, and the default height put
 * the driver form well past two screens.
 */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 50,
    borderRadius: '11px',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: '#DFE3EA' },
    '&:hover fieldset': { borderColor: '#C3CAD6' },
    '&.Mui-focused fieldset': { borderColor: tokens.amber, borderWidth: '1.5px' },
  },
  '& .MuiOutlinedInput-input': { fontSize: 14.5 },
} as const;

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');

  const [role, setRole] = useState<SignupRole>(isSignupRole(initialRole) ? initialRole : 'advertiser');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitted, setSubmitted] = useState<RegistrationResult | null>(null);

  const [regions, setRegions] = useState<RegionOption[]>([]);

  // Shared fields.
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [region, setRegion] = useState('');
  const [password, setPassword] = useState('');

  // Driver-only.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateCharacter, setPlateCharacter] = useState('B');
  const [carType, setCarType] = useState<string>(CAR_TYPES[0]);
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState<number>(YEARS[0]);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [carPapersImage, setCarPapersImage] = useState<File | null>(null);

  const activeRole = ROLES.find((r) => r.value === role) ?? ROLES[0];

  // The regions the platform actually holds. A hardcoded list drifts, and the drift is silent:
  // registration succeeds and the region resolves to nothing.
  useEffect(() => {
    const controller = new AbortController();

    fetchRegions(controller.signal)
      .then((list) => {
        setRegions(list);
        setRegion((current) => current || list[0]?.name || '');
      })
      .catch(() => {
        if (!controller.signal.aborted) setRegions([]);
      });

    return () => controller.abort();
  }, []);

  const resetFeedback = () => {
    setError(null);
    setAlreadyRegistered(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    resetFeedback();
    setSubmitting(true);

    try {
      const result = await submitFor();
      setSubmitted(result);
    } catch (e: unknown) {
      if (e instanceof RegistrationError && e.isAlreadyRegistered) {
        setAlreadyRegistered(true);
        setError(e.message);
      } else if (e instanceof ImageTooLargeError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitFor = async (): Promise<RegistrationResult> => {
    if (role === 'advertiser') {
      return registerAdvertiser({
        companyName: name.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        mobileNumber: mobile.trim() || undefined,
        password,
      });
    }

    if (role === 'taxiCompany') {
      return registerTaxiCompany({
        companyName: name.trim(),
        email: email.trim(),
        mobileNumber: mobile.trim(),
        region,
        password,
      });
    }

    if (!idImage || !licenseImage || !carPapersImage) {
      // Required here rather than server-side: the endpoint accepts a registration without
      // documents, and an admin then has nothing to review.
      throw new Error('Please upload all three documents so your application can be reviewed.');
    }

    // Downscaled before encoding — three untouched phone photos in one JSON body is a
    // twenty-megabyte upload from a street corner.
    const [idImageBase64, licenseImageBase64, carPapersImageBase64] = await Promise.all([
      toCompressedBase64(idImage),
      toCompressedBase64(licenseImage),
      toCompressedBase64(carPapersImage),
    ]);

    return registerDriver({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobileNumber: mobile.trim(),
      region,
      plateNumber: plateNumber.trim(),
      plateCharacter,
      carType,
      carModel: carModel.trim(),
      carYear,
      password,
      idImageBase64,
      licenseImageBase64,
      carPapersImageBase64,
    });
  };

  const switchRole = (next: SignupRole) => {
    setRole(next);
    resetFeedback();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '44fr 56fr' },
        backgroundColor: PANEL_BG,
      }}
    >
      <BrandPanel />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: '20px', sm: '32px', md: '56px' },
          py: { xs: '28px', md: '48px' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          {/* At the top, where someone decides to leave — not floating under the whole form.
              Hidden on the confirmation, which offers the same destination as a button. */}
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            sx={{
              display: submitted ? 'none' : 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: 13.5,
              fontWeight: 500,
              color: tokens.textMuted,
              mb: { xs: '22px', md: '34px' },
              '&:hover': { color: tokens.navy },
              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '3px', borderRadius: '4px' },
            }}
          >
            <Box component="span" aria-hidden>
              &larr;
            </Box>
            Back to homepage
          </Link>

          {submitted ? (
            <SubmittedPanel role={activeRole} result={submitted} />
          ) : (
            <>
              <Typography
                component="h1"
                sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
              >
                Create your account
              </Typography>
              <Typography sx={{ mt: '8px', fontSize: 15, color: 'text.secondary' }}>
                Choose how you&rsquo;re joining AdzOnRoad.
              </Typography>

              <Box
                role="radiogroup"
                aria-label="Account type"
                sx={{
                  mt: { xs: '22px', md: '28px' },
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: '10px',
                }}
              >
                {ROLES.map((option) => {
                  const selected = option.value === role;
                  return (
                    <Box
                      key={option.value}
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-selected={selected ? 'true' : undefined}
                      disabled={submitting}
                      onClick={() => switchRole(option.value)}
                      sx={{
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '13px 14px',
                        borderRadius: '12px',
                        border: '1px solid #DFE3EA',
                        backgroundColor: '#fff',
                        transition: 'border-color .18s ease, background-color .18s ease',
                        '&:hover:not(:disabled)': { borderColor: '#C3CAD6' },
                        '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                        '&:disabled': { cursor: 'default', opacity: 0.7 },
                        '&[data-selected="true"]': {
                          borderColor: tokens.amber,
                          backgroundColor: 'rgba(245,166,35,0.08)',
                        },
                        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', mb: '5px' }}>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            color: selected ? tokens.navy : tokens.textMuted,
                          }}
                        >
                          {option.label}
                        </Typography>
                        {/* State carried by a mark as well as by colour. */}
                        <Box
                          aria-hidden
                          sx={{
                            width: 15,
                            height: 15,
                            flexShrink: 0,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            border: selected ? 'none' : '1px solid #D3D8E2',
                            backgroundColor: selected ? tokens.amber : 'transparent',
                            color: tokens.navy,
                            fontSize: 10,
                            fontWeight: 900,
                            lineHeight: 1,
                          }}
                        >
                          {selected ? '✓' : ''}
                        </Box>
                      </Box>
                      <Typography component="span" sx={{ display: 'block', fontSize: 12.5, lineHeight: 1.5, color: 'text.secondary' }}>
                        {option.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: '26px', display: 'grid', gap: '16px' }}>
                {error && (
                  <Alert severity={alreadyRegistered ? 'info' : 'error'} sx={{ fontSize: 13, borderRadius: '11px' }}>
                    {error}
                    {alreadyRegistered && (
                      <>
                        {' '}
                        <Link component={RouterLink} to={`/login?role=${role}`} sx={{ fontWeight: 600 }}>
                          Sign in instead
                        </Link>
                      </>
                    )}
                  </Alert>
                )}

                {role === 'driver' ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
                      <Field id="signup-first-name" label="First name" required>
                        <TextField id="signup-first-name" required fullWidth placeholder="Rana" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                      <Field id="signup-last-name" label="Last name" required>
                        <TextField id="signup-last-name" required fullWidth placeholder="Khoury" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                    </Box>
                    <Field id="signup-mobile" label="Mobile number" required>
                      <TextField id="signup-mobile" type="tel" required fullWidth placeholder="+961 …" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>
                    <RegionField id="signup-region" regions={regions} value={region} onChange={setRegion} disabled={submitting} />

                    {/* The vehicle and the documents stay on this form. There is no separate driver
                        onboarding step to defer them to, and an application that arrives without
                        them gives the reviewing admin nothing to approve. */}
                    <SectionHeading>Your vehicle</SectionHeading>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                      <Field id="signup-plate" label="Plate number" required>
                        <TextField id="signup-plate" required fullWidth value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                      <Field id="signup-plate-letter" label="Letter" required>
                        <TextField id="signup-plate-letter" select required fullWidth value={plateCharacter} onChange={(e) => setPlateCharacter(e.target.value)} disabled={submitting} sx={fieldSx}>
                          {PLATE_CHARACTERS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                      </Field>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
                      <Field id="signup-car-type" label="Car type" required>
                        <TextField id="signup-car-type" select required fullWidth value={carType} onChange={(e) => setCarType(e.target.value)} disabled={submitting} sx={fieldSx}>
                          {CAR_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                      </Field>
                      <Field id="signup-car-year" label="Year" required>
                        <TextField id="signup-car-year" select required fullWidth value={carYear} onChange={(e) => setCarYear(Number(e.target.value))} disabled={submitting} sx={fieldSx}>
                          {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </TextField>
                      </Field>
                    </Box>
                    <Field id="signup-car-model" label="Model" required>
                      <TextField id="signup-car-model" required fullWidth placeholder="Toyota Corolla" value={carModel} onChange={(e) => setCarModel(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>

                    <SectionHeading>Documents</SectionHeading>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '-8px' }}>
                      Photos are resized in your browser before upload, so this works on mobile data.
                    </Typography>
                    <ImageUploadField label="National ID" file={idImage} onChange={setIdImage} />
                    <ImageUploadField label="Driver's licence" file={licenseImage} onChange={setLicenseImage} />
                    <ImageUploadField label="Car papers" file={carPapersImage} onChange={setCarPapersImage} />
                  </>
                ) : (
                  <>
                    <Field
                      id="signup-company"
                      label={role === 'taxiCompany' ? 'Company / fleet name' : 'Company name'}
                      required
                    >
                      <TextField
                        id="signup-company"
                        required
                        fullWidth
                        placeholder={role === 'taxiCompany' ? 'Enter your fleet name' : 'Enter your company name'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submitting}
                        sx={fieldSx}
                      />
                    </Field>

                    {role === 'advertiser' && (
                      <Field id="signup-contact" label="Contact name" required>
                        <TextField id="signup-contact" required fullWidth placeholder="Who should we speak to?" value={contactName} onChange={(e) => setContactName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                    )}

                    <Field id="signup-email" label="Work email" required>
                      <TextField id="signup-email" type="email" autoComplete="email" required fullWidth placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>

                    <Field
                      id="signup-mobile"
                      label="Mobile number"
                      required={role === 'taxiCompany'}
                      optional={role !== 'taxiCompany'}
                    >
                      <TextField
                        id="signup-mobile"
                        type="tel"
                        required={role === 'taxiCompany'}
                        fullWidth
                        placeholder="+961 …"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        disabled={submitting}
                        sx={fieldSx}
                      />
                    </Field>

                    {/* Fleet registration carries a region, so it is asked for here rather than
                        left to default to whichever region happened to load first. */}
                    {role === 'taxiCompany' && (
                      <RegionField id="signup-region" regions={regions} value={region} onChange={setRegion} disabled={submitting} />
                    )}
                  </>
                )}

                <Field
                  id="signup-password"
                  label="Password"
                  required
                  hint="Use at least 8 characters, including a number and symbol."
                >
                  <PasswordField
                    id="signup-password"
                    autoComplete="new-password"
                    required
                    fullWidth
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    sx={fieldSx}
                  />
                </Field>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{ mt: '4px', minHeight: 52, borderRadius: '11px', fontSize: 15.5 }}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {submitting ? 'Submitting…' : activeRole.cta}
                  {!submitting && (
                    <Box component="span" aria-hidden sx={{ ml: '9px', fontSize: 16, lineHeight: 1 }}>
                      &rarr;
                    </Box>
                  )}
                </Button>

                {/* Under the button rather than above the form: it explains what happens next,
                    which is not a question until someone is ready to submit. */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 9,
                      height: 9,
                      mt: '5px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: `1.5px solid ${tokens.amber}`,
                    }}
                  />
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                    Accounts are reviewed before activation. {activeRole.review}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: '26px', fontSize: 14, color: 'text.secondary' }}>
                Already have an account?{' '}
                <Link component={RouterLink} to={`/login?role=${role}`} underline="hover" sx={{ fontWeight: 700, color: tokens.navy }}>
                  Log in
                </Link>
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The navy half.
 *
 * Collapses to a compact header on a phone rather than a half-screen of decoration: the form is
 * what someone came for, and it should be the first thing under the logo.
 */
function BrandPanel() {
  return (
    <Box
      sx={{
        backgroundColor: tokens.navy,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: '20px', sm: '32px', md: '52px' },
        py: { xs: '26px', md: '48px' },
      }}
    >
      {/* The full logo is black type with an orange car, so it disappears on navy. Rendered as a
          mono-white version of the real mark rather than swapped for the icon on its own. */}
      <Box sx={{ filter: 'brightness(0) invert(1)', width: 'fit-content' }}>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Logo size="md" />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Logo size="lg" />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: '20px', md: '64px' }, flex: { md: 1 } }}>
        <Typography
          sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.amber, mb: { xs: '10px', md: '16px' } }}
        >
          Join the network
        </Typography>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 24, md: 'clamp(30px,3vw,40px)' },
            lineHeight: 1.08,
            letterSpacing: '-0.032em',
            color: '#fff',
          }}
        >
          One network.
          <Box component="span" sx={{ display: 'block' }}>
            Different ways to move.
          </Box>
        </Typography>

        <Typography
          sx={{
            mt: { xs: '12px', md: '18px' },
            fontSize: { xs: 14, md: 15 },
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '42ch',
          }}
        >
          Whether you&rsquo;re launching campaigns, driving with AdzOnRoad, or managing a fleet,
          start by choosing how you want to join.
        </Typography>

        {/* Campaign to delivery, drawn rather than described. Hidden on a phone, where it would
            sit between someone and the form. */}
        <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' }, mt: '52px' }}>
          {NETWORK_FLOW.map((step, i) => (
            <Box key={step} sx={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10 }}>
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    mt: '6px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: i === 0 || i === NETWORK_FLOW.length - 1 ? tokens.amber : 'transparent',
                    border: i === 0 || i === NETWORK_FLOW.length - 1 ? 'none' : '1.25px solid rgba(255,255,255,0.42)',
                  }}
                />
                {i < NETWORK_FLOW.length - 1 && (
                  <Box sx={{ width: '1px', flex: 1, minHeight: 30, mt: '5px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </Box>
              <Typography
                sx={{
                  pb: i < NETWORK_FLOW.length - 1 ? '16px' : 0,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {step}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' }, mt: '40px', pt: '26px', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
        <Typography
          sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber, mb: '8px' }}
        >
          Built for Lebanon
        </Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', maxWidth: '38ch' }}>
          Digital outdoor advertising designed around the way our cities move.
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * What replaces the form once the server has the application.
 *
 * Nothing self-approves, so there is no path from here to a dashboard — sending someone to one
 * would describe an account that does not exist yet. No timeframe is quoted either; the platform
 * has not committed to one.
 */
function SubmittedPanel({
  role,
  result,
}: {
  role: (typeof ROLES)[number];
  result: RegistrationResult;
}) {
  return (
    <Box>
      <CheckCircleRoundedIcon sx={{ fontSize: 44, color: tokens.green, mb: '18px', display: 'block' }} />

      <Typography
        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber, mb: '10px' }}
      >
        Account submitted
      </Typography>

      <Typography
        component="h1"
        sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
      >
        Your account is under review.
      </Typography>

      <Typography sx={{ mt: '14px', fontSize: 15, color: 'text.secondary', lineHeight: 1.7, maxWidth: '46ch' }}>
        {role.submittedNote}
      </Typography>

      <Typography sx={{ mt: '14px', fontSize: 14, color: 'text.secondary', lineHeight: 1.7, maxWidth: '52ch' }}>
        {result.message}
      </Typography>

      <Box sx={{ mt: '22px', px: '14px', py: '11px', borderRadius: '11px', border: '1px solid #E4E7EC', backgroundColor: '#fff' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '4px' }}>
          Reference
        </Typography>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.navy, wordBreak: 'break-all' }}>
          {result.id}
        </Typography>
      </Box>

      <Box sx={{ mt: '28px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          sx={{ minHeight: 50, borderRadius: '11px' }}
        >
          Back to homepage
        </Button>
        <Button
          component={RouterLink}
          to={`/login?role=${role.value}`}
          variant="outlined"
          size="large"
          sx={{ minHeight: 50, borderRadius: '11px', borderColor: '#DFE3EA', color: tokens.navy }}
        >
          Log in
        </Button>
      </Box>
    </Box>
  );
}

/**
 * A visible label above its field.
 *
 * Placeholders alone vanish the moment someone types, which on a form this long means a filled
 * field no longer says what it holds. `htmlFor` is why every field below passes an explicit id.
 */
function Field({
  id,
  label,
  required,
  optional,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.navy, mb: '7px' }}
      >
        {label}
        {required && (
          <Box component="span" aria-hidden sx={{ ml: '3px', color: tokens.amber600 }}>
            *
          </Box>
        )}
        {optional && (
          <Box component="span" sx={{ ml: '5px', fontWeight: 500, color: tokens.textMuted }}>
            (optional)
          </Box>
        )}
      </Typography>
      {children}
      {hint && (
        <Typography sx={{ mt: '7px', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Regions as served by the API. Falls back to a free-text field rather than a stale hardcoded
 * list — a typo an admin can see beats a tidy dropdown of regions the server does not recognise.
 */
function RegionField({
  id,
  regions,
  value,
  onChange,
  disabled,
}: {
  id: string;
  regions: RegionOption[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Field id={id} label="Region" required>
      {regions.length === 0 ? (
        <TextField
          id={id}
          required
          fullWidth
          placeholder="Beirut"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={fieldSx}
        />
      ) : (
        <TextField
          id={id}
          select
          required
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={fieldSx}
        >
          {regions.map((r) => (
            <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>
          ))}
        </TextField>
      )}
    </Field>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: tokens.textMuted, mt: '10px' }}
    >
      {children}
    </Typography>
  );
}
