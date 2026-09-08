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
import AuthShell, { AuthField, authFieldSx } from '../layouts/AuthShell';
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
import { useTranslation } from 'react-i18next';
import { tokens } from '../theme';
import DirArrow from '../components/DirArrow';

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
    labelKey: 'roles.advertiser',
    descriptionKey: 'auth.signup.roles.advertiserDescription',
    ctaKey: 'auth.signup.roles.advertiserCta',
    reviewKey: 'auth.signup.roles.advertiserReview',
    submittedKey: 'auth.signup.roles.advertiserSubmitted',
  },
  {
    value: 'driver',
    labelKey: 'roles.driver',
    descriptionKey: 'auth.signup.roles.driverDescription',
    ctaKey: 'auth.signup.roles.driverCta',
    reviewKey: 'auth.signup.roles.driverReview',
    submittedKey: 'auth.signup.roles.driverSubmitted',
  },
  {
    value: 'taxiCompany',
    labelKey: 'roles.fleetPartner',
    descriptionKey: 'auth.signup.roles.fleetDescription',
    ctaKey: 'auth.signup.roles.fleetCta',
    reviewKey: 'auth.signup.roles.fleetReview',
    submittedKey: 'auth.signup.roles.fleetSubmitted',
  },
] as const;

/** Shared with the login page so the two cannot drift apart. */
const fieldSx = authFieldSx;
const Field = AuthField;

export default function SignupPage() {
  const { t } = useTranslation();
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
        setError(e instanceof Error ? e.message : t('auth.signup.genericError'));
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
      throw new Error(t('auth.signup.documentsRequired'));
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
    <AuthShell
      eyebrow={t('auth.signup.eyebrow')}
      headline={
        <>
          {t('auth.signup.brandHeadlineLine1')}
          <Box component="span" sx={{ display: 'block' }}>
            {t('auth.signup.brandHeadlineLine2')}
          </Box>
        </>
      }
      copy={t('auth.signup.brandCopy')}
      footerTitle={t('auth.brand.builtForLebanon')}
      footerCopy={t('auth.signup.footerCopy')}
      contentMaxWidth={600}
      showBackLink={submitted === null}
    >
      {submitted ? (
            <SubmittedPanel role={activeRole} result={submitted} />
          ) : (
            <>
              <Typography
                component="h1"
                sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
              >
                {t('auth.signup.title')}
              </Typography>
              <Typography sx={{ mt: '8px', fontSize: 15, color: 'text.secondary' }}>
                {t('auth.signup.subtitle')}
              </Typography>

              <Box
                role="radiogroup"
                aria-label={t('auth.signup.accountType')}
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
                          {t(option.labelKey)}
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
                        {t(option.descriptionKey)}
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
                          {t('auth.signup.signInInstead')}
                        </Link>
                      </>
                    )}
                  </Alert>
                )}

                {role === 'driver' ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
                      <Field id="signup-first-name" label={t('auth.signup.fields.firstName')} required>
                        <TextField id="signup-first-name" required fullWidth placeholder={t('auth.signup.fields.firstNamePlaceholder')} value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                      <Field id="signup-last-name" label={t('auth.signup.fields.lastName')} required>
                        <TextField id="signup-last-name" required fullWidth placeholder={t('auth.signup.fields.lastNamePlaceholder')} value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                    </Box>
                    <Field id="signup-mobile" label={t('auth.signup.fields.mobile')} required>
                      <TextField id="signup-mobile" type="tel" required fullWidth placeholder={t('auth.signup.fields.mobilePlaceholder')} value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>
                    <RegionField id="signup-region" regions={regions} value={region} onChange={setRegion} disabled={submitting} />

                    {/* The vehicle and the documents stay on this form. There is no separate driver
                        onboarding step to defer them to, and an application that arrives without
                        them gives the reviewing admin nothing to approve. */}
                    <SectionHeading>{t('auth.signup.sections.vehicle')}</SectionHeading>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                      <Field id="signup-plate" label={t('auth.signup.fields.plateNumber')} required>
                        <TextField id="signup-plate" required fullWidth value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                      <Field id="signup-plate-letter" label={t('auth.signup.fields.plateLetter')} required>
                        <TextField id="signup-plate-letter" select required fullWidth value={plateCharacter} onChange={(e) => setPlateCharacter(e.target.value)} disabled={submitting} sx={fieldSx}>
                          {PLATE_CHARACTERS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                      </Field>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
                      <Field id="signup-car-type" label={t('auth.signup.fields.carType')} required>
                        <TextField id="signup-car-type" select required fullWidth value={carType} onChange={(e) => setCarType(e.target.value)} disabled={submitting} sx={fieldSx}>
                          {CAR_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {t(`auth.signup.carTypes.${type}`)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Field>
                      <Field id="signup-car-year" label={t('auth.signup.fields.carYear')} required>
                        <TextField id="signup-car-year" select required fullWidth value={carYear} onChange={(e) => setCarYear(Number(e.target.value))} disabled={submitting} sx={fieldSx}>
                          {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </TextField>
                      </Field>
                    </Box>
                    <Field id="signup-car-model" label={t('auth.signup.fields.carModel')} required>
                      <TextField id="signup-car-model" required fullWidth placeholder={t('auth.signup.fields.carModelPlaceholder')} value={carModel} onChange={(e) => setCarModel(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>

                    <SectionHeading>{t('auth.signup.sections.documents')}</SectionHeading>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '-8px' }}>
                      {t('auth.signup.sections.documentsHint')}
                    </Typography>
                    <ImageUploadField label={t('auth.signup.sections.nationalId')} file={idImage} onChange={setIdImage} />
                    <ImageUploadField label={t('auth.signup.sections.licence')} file={licenseImage} onChange={setLicenseImage} />
                    <ImageUploadField label={t('auth.signup.sections.carPapers')} file={carPapersImage} onChange={setCarPapersImage} />
                  </>
                ) : (
                  <>
                    <Field
                      id="signup-company"
                      label={t(role === 'taxiCompany' ? 'auth.signup.fields.fleetName' : 'auth.signup.fields.companyName')}
                      required
                    >
                      <TextField
                        id="signup-company"
                        required
                        fullWidth
                        placeholder={t(role === 'taxiCompany' ? 'auth.signup.fields.fleetNamePlaceholder' : 'auth.signup.fields.companyNamePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submitting}
                        sx={fieldSx}
                      />
                    </Field>

                    {role === 'advertiser' && (
                      <Field id="signup-contact" label={t('auth.signup.fields.contactName')} required>
                        <TextField id="signup-contact" required fullWidth placeholder={t('auth.signup.fields.contactNamePlaceholder')} value={contactName} onChange={(e) => setContactName(e.target.value)} disabled={submitting} sx={fieldSx} />
                      </Field>
                    )}

                    <Field id="signup-email" label={t('auth.signup.fields.workEmail')} required>
                      <TextField id="signup-email" type="email" autoComplete="email" required fullWidth placeholder={t('auth.signup.fields.workEmailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} sx={fieldSx} />
                    </Field>

                    <Field
                      id="signup-mobile"
                      label={t('auth.signup.fields.mobile')}
                      required={role === 'taxiCompany'}
                      optional={role !== 'taxiCompany'}
                    >
                      <TextField
                        id="signup-mobile"
                        type="tel"
                        required={role === 'taxiCompany'}
                        fullWidth
                        placeholder={t('auth.signup.fields.mobilePlaceholder')}
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
                  label={t('common.password')}
                  required
                  hint={t('auth.signup.fields.passwordHint')}
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
                  {submitting ? t('auth.signup.submitting') : t(activeRole.ctaKey)}
                  {!submitting && (
                    <Box component="span" aria-hidden sx={{ ml: '9px', fontSize: 16, lineHeight: 1 }}>
                      <DirArrow />
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
                    {t('auth.signup.review')} {t(activeRole.reviewKey)}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: '26px', fontSize: 14, color: 'text.secondary' }}>
                {t('auth.signup.alreadyHaveAccount')}{' '}
                <Link component={RouterLink} to={`/login?role=${role}`} underline="hover" sx={{ fontWeight: 700, color: tokens.navy }}>
                  {t('common.signIn')}
                </Link>
              </Typography>
            </>
      )}
    </AuthShell>
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
  const { t } = useTranslation();

  return (
    <Box>
      <CheckCircleRoundedIcon sx={{ fontSize: 44, color: tokens.green, mb: '18px', display: 'block' }} />

      <Typography
        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber, mb: '10px' }}
      >
        {t('auth.signup.submitted.eyebrow')}
      </Typography>

      <Typography
        component="h1"
        sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
      >
        {t('auth.signup.submitted.title')}
      </Typography>

      <Typography sx={{ mt: '14px', fontSize: 15, color: 'text.secondary', lineHeight: 1.7, maxWidth: '46ch' }}>
        {t(role.submittedKey)}
      </Typography>

      <Typography sx={{ mt: '14px', fontSize: 14, color: 'text.secondary', lineHeight: 1.7, maxWidth: '52ch' }}>
        {result.message}
      </Typography>

      <Box sx={{ mt: '22px', px: '14px', py: '11px', borderRadius: '11px', border: '1px solid #E4E7EC', backgroundColor: '#fff' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '4px' }}>
          {t('auth.signup.submitted.reference')}
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
          {t('common.backToHomepage')}
        </Button>
        <Button
          component={RouterLink}
          to={`/login?role=${role.value}`}
          variant="outlined"
          size="large"
          sx={{ minHeight: 50, borderRadius: '11px', borderColor: '#DFE3EA', color: tokens.navy }}
        >
          {t('common.signIn')}
        </Button>
      </Box>
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
  const { t } = useTranslation();

  return (
    <Field id={id} label={t('auth.signup.fields.region')} required>
      {regions.length === 0 ? (
        <TextField
          id={id}
          required
          fullWidth
          placeholder={t('auth.signup.fields.regionPlaceholder')}
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
