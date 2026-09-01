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
import AuthLayout from '../layouts/AuthLayout';
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

  // Every account type lands here. Nothing self-approves, so there is no path from this page to a
  // dashboard — sending someone to one would describe an account that does not exist yet.
  if (submitted) {
    return (
      <AuthLayout
        title="Application submitted"
        subtitle="Your account is being reviewed"
        role={role}
        onRoleChange={(r) => switchRole(r as SignupRole)}
        roles={['advertiser', 'driver', 'taxiCompany']}
        footerText="Already have an account?"
        footerLinkText="Log in"
        footerLinkTo={`/login?role=${role}`}
      >
        <Box sx={{ textAlign: 'center', py: '8px' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 48, color: tokens.green, mb: '12px' }} />
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '8px' }}>
            Thanks, {firstName || contactName || name || 'partner'} — we've got it.
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{submitted.message}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '12px' }}>
            Reference: {submitted.id}
          </Typography>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Every account is reviewed before it goes live"
      role={role}
      onRoleChange={(r) => switchRole(r as SignupRole)}
      roles={['advertiser', 'driver', 'taxiCompany']}
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo={`/login?role=${role}`}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
        {error && (
          <Alert severity={alreadyRegistered ? 'info' : 'error'} sx={{ fontSize: 13 }}>
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField label="First name" required fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
              <TextField label="Last name" required fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} />
            </Box>
            <TextField label="Mobile number" type="tel" required fullWidth value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={submitting} />
            <RegionField regions={regions} value={region} onChange={setRegion} disabled={submitting} />

            <SectionHeading>Your vehicle</SectionHeading>
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <TextField label="Plate number" required fullWidth value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} disabled={submitting} />
              <TextField label="Letter" select required fullWidth value={plateCharacter} onChange={(e) => setPlateCharacter(e.target.value)} disabled={submitting}>
                {PLATE_CHARACTERS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField label="Car type" select required fullWidth value={carType} onChange={(e) => setCarType(e.target.value)} disabled={submitting}>
                {CAR_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Year" select required fullWidth value={carYear} onChange={(e) => setCarYear(Number(e.target.value))} disabled={submitting}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="Model" required fullWidth placeholder="Toyota Corolla" value={carModel} onChange={(e) => setCarModel(e.target.value)} disabled={submitting} />

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
            <TextField label="Company name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
            {role === 'advertiser' && (
              <TextField label="Contact name" required fullWidth value={contactName} onChange={(e) => setContactName(e.target.value)} disabled={submitting} />
            )}
            <TextField label="Email" type="email" autoComplete="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
            <TextField
              label={role === 'taxiCompany' ? 'Mobile number' : 'Mobile number (optional)'}
              type="tel"
              required={role === 'taxiCompany'}
              fullWidth
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={submitting}
            />
            {role === 'taxiCompany' && (
              <RegionField regions={regions} value={region} onChange={setRegion} disabled={submitting} />
            )}
          </>
        )}

        <PasswordField
          label="Password"
          autoComplete="new-password"
          required
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          helperText="At least 8 characters, with a number and a symbol."
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </Button>
      </Box>
    </AuthLayout>
  );
}

/**
 * Regions as served by the API. Falls back to a free-text field rather than a stale hardcoded
 * list — a typo an admin can see beats a tidy dropdown of regions the server does not recognise.
 */
function RegionField({
  regions,
  value,
  onChange,
  disabled,
}: {
  regions: RegionOption[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  if (regions.length === 0) {
    return (
      <TextField
        label="Region"
        required
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  }

  return (
    <TextField label="Region" select required fullWidth value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      {regions.map((r) => (
        <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>
      ))}
    </TextField>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mt: '4px' }}>
      {children}
    </Typography>
  );
}
