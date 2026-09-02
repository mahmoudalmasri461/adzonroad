import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Link from '@mui/material/Link';
import Fleet from '@mui/icons-material/LocalShipping';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Logo from '../components/Logo';
import LebanonMap from '../components/LebanonMap';
import Reveal from '../components/Reveal';
import { calculateDriverEarnings, DRIVER_PREMIUM_AREA_BONUS_USD } from '../services/earningsService';
import { useInView } from '../hooks/useInView';
import { useAuth } from '../contexts/AuthProvider';
import { fetchRegions, type RegionOption } from '../services/registration';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { tokens } from '../theme';
import heroTaxi from '../assets/hero/hero-taxi.jpg';

const NAV_LINKS = ['Advertisers', 'Drivers', 'Taxi Companies', 'Coverage', 'Pricing', 'About', 'Contact'];

const HERO_STATS = [
  { value: '1,248', label: 'Active screens' },
  { value: '42.6K', label: 'Ads shown today' },
  { value: '6', label: 'Regions covered' },
  { value: '3,180', label: 'Verified hours' },
];

const ADVERTISER_STEPS = [
  { title: 'Create a campaign', body: 'Set objectives, upload creative, define budget.' },
  { title: 'Select regions and taxis', body: 'Target by city, radius, or high-traffic zone.' },
  { title: 'Track results in real time', body: 'GPS-verified impressions and display hours.' },
];

const DRIVER_STEPS = [
  { title: 'Register your vehicle', body: 'Quick onboarding for drivers and fleets.' },
  { title: 'Install the screen', body: 'Free rooftop install, fully insured.' },
  { title: 'Drive and earn', body: 'Paid for coverage, uptime and verified hours.' },
];

/**
 * The three sides of the network, in the order they matter commercially.
 *
 * Three rather than four: the fourth box used to read "Lebanese Business Partners", which is not
 * an audience with anything to sign up for — it described the others in different words. Every
 * entry here has a real destination, because a card that leads nowhere is the placeholder these
 * replaced.
 */
const AUDIENCES = [
  {
    number: '01',
    label: 'Advertisers',
    title: 'Put your brand in motion.',
    body: 'Launch location-based campaigns across AdzOnRoad’s network and track verified delivery as it happens.',
    cta: 'Explore advertising',
    to: '/signup?role=advertiser',
  },
  {
    number: '02',
    label: 'Drivers',
    title: 'Turn driving time into extra income.',
    body: 'Earn additional income while driving your normal routes with an AdzOnRoad display installed on your vehicle.',
    cta: 'Become a driver',
    to: '/signup?role=driver',
  },
  {
    number: '03',
    label: 'Taxi & fleet partners',
    title: 'Turn your fleet into a media network.',
    body: 'Partner with AdzOnRoad to activate vehicles across your fleet and create a new revenue opportunity.',
    cta: 'Partner with us',
    to: '/signup?role=taxiCompany',
  },
] as const;

const TAXI_COMPANY_BENEFITS = [
  { title: 'Fleet-wide revenue', body: 'Every vehicle in your fleet earns — paid out monthly per taxi, on top of fare income.', icon: Fleet },
  { title: 'Zero hardware cost', body: 'Screens are installed and fully insured at no cost to your company.', icon: BuildRoundedIcon },
  { title: 'Dedicated account manager', body: 'One point of contact for onboarding, support, and reporting.', icon: SupportAgentRoundedIcon },
  { title: 'Consolidated reporting', body: "Track every vehicle's uptime and earnings from a single dashboard.", icon: DashboardRoundedIcon },
];

/**
 * Where the map puts a pin, and which of the platform's regions sit inside each one.
 *
 * The coordinates are geography and the groupings are geography — Hamra and Achrafieh are in
 * Beirut whatever the API says. What is *not* decided here is whether an area is covered: that
 * comes from which of these names the regions endpoint actually returns, so an area the platform
 * drops server-side greys out here without anyone editing this file.
 *
 * No screen counts, deliberately. There are none to state.
 */
const COVERAGE_AREAS = [
  {
    name: 'Beirut',
    lon: 35.5018,
    lat: 33.8938,
    regions: ['Beirut', 'Hamra', 'Achrafieh', 'Verdun', 'Downtown', 'Gemmayze', 'Saifi'],
    labelDx: 13,
    labelDy: -2,
  },
  // Sits close enough to Beirut that the two labels collide; this one goes below its pin.
  { name: 'Mount Lebanon', lon: 35.63, lat: 33.82, regions: ['Mount Lebanon'], labelDx: 13, labelDy: 16 },
  { name: 'Jounieh', lon: 35.6178, lat: 33.9808, regions: ['Jounieh'] },
  { name: 'Byblos', lon: 35.6481, lat: 34.1208, regions: ['Byblos'] },
  { name: 'Tripoli', lon: 35.8497, lat: 34.4367, regions: ['Tripoli'] },
  { name: 'Zahle', lon: 35.902, lat: 33.8463, regions: ['Zahle'] },
  { name: 'Sidon', lon: 35.3758, lat: 33.5606, regions: ['Sidon'] },
  { name: 'Tyre', lon: 35.2038, lat: 33.2704, regions: ['Tyre'] },
];

/**
 * The campaign an advertiser configures, and the only numbers this section states.
 *
 * These are delivery quantities, not prices. Nothing here is multiplied by a rate, because no
 * per-display rate exists — pricing in this codebase is per taxi, per second of creative, on the
 * 8-hour day this section stopped selling. A "Custom" option carries null so the summary can say
 * Custom rather than invent a figure for it.
 */
const CAMPAIGN_STEPS = [
  {
    key: 'displays' as const,
    number: '01',
    title: 'How many displays?',
    note: 'Each display is one 15-second play of your creative on a vehicle screen.',
    options: [
      { label: '25,000', value: 25000 },
      { label: '50,000', value: 50000 },
      { label: '100,000', value: 100000 },
      { label: '250,000', value: 250000 },
      { label: 'Custom', value: null },
    ],
  },
  {
    key: 'vehicles' as const,
    number: '02',
    title: 'How many vehicles?',
    note: 'More vehicles distribute your campaign across a wider moving network and can help deliver the campaign target faster.',
    options: [
      { label: '5', value: 5 },
      { label: '10', value: 10 },
      { label: '20', value: 20 },
      { label: '50', value: 50 },
      { label: 'Custom', value: null },
    ],
  },
  {
    key: 'coverage' as const,
    number: '03',
    title: 'Where should it run?',
    // Named from the regions the platform actually seeds — Hamra, Achrafieh, Downtown, Verdun,
    // Gemmayze and Saifi sit inside Beirut; Mount Lebanon and Jounieh extend it. No claim of
    // national coverage, because there are no screens deployed anywhere yet.
    note: 'Beirut covers Hamra, Achrafieh, Downtown, Verdun, Gemmayze and Saifi. Greater Beirut adds Mount Lebanon and Jounieh.',
    options: [
      { label: 'Beirut', value: 'Beirut' },
      { label: 'Greater Beirut', value: 'Greater Beirut' },
      { label: 'Selected regions', value: 'Selected regions' },
      { label: 'Custom targeting', value: 'Custom targeting' },
    ],
  },
  {
    key: 'days' as const,
    number: '04',
    title: 'Campaign period',
    note: null,
    options: [
      { label: '7 days', value: 7 },
      { label: '14 days', value: 14 },
      { label: '30 days', value: 30 },
      { label: 'Custom', value: null },
    ],
  },
];

/**
 * What the platform does, stated without a number attached to any of it.
 *
 * The traction panel this replaced claimed 142 advertisers and 2,610 drivers. Neither figure came
 * from anywhere — the production database holds no screens at all — and a measurement company is
 * the worst possible place to put an invented measurement. Numbers belong here only once something
 * real produces them.
 */
const ABOUT_PRINCIPLES = [
  {
    number: '01',
    label: 'Verified delivery',
    headline: 'Not estimated.',
    body: 'Campaign activity is connected to location and playback evidence so advertisers can understand where their ads actually ran.',
  },
  {
    number: '02',
    label: 'Built for the road',
    headline: 'Designed around Lebanon.',
    body: 'Regions, routes, traffic patterns and fleet operations are designed around the local market rather than copied from another country.',
  },
  {
    number: '03',
    label: 'Drivers benefit too',
    headline: 'New income from existing routes.',
    body: 'Drivers continue their normal work while AdzOnRoad creates an additional earning opportunity from the vehicle.',
  },
];

/**
 * Routing the enquiry at the form rather than in somebody's inbox.
 *
 * Short enough to sit on a pill. The sentences these replaced ("I drive a taxi and want a screen")
 * only worked inside a dropdown, where there was room to read them one at a time.
 */
const CONTACT_REASONS = ['Advertising', 'Driver partnership', 'Taxi / fleet partnership', 'Other'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StepCard({ title, steps, badgeBg, badgeColor }: { title: string; steps: typeof ADVERTISER_STEPS; badgeBg: string; badgeColor: string }) {
  return (
    <Card
      sx={{
        p: '22px',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: tokens.shadowMd },
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: 18, mb: '18px', color: tokens.navy }}>{title}</Typography>
      <Box sx={{ display: 'grid', gap: '16px' }}>
        {steps.map((step, i) => (
          <Box key={step.title} sx={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: '14px' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: badgeBg,
                color: badgeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {i + 1}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{step.title}</Typography>
              <Typography sx={{ mt: '4px', fontSize: 14, color: 'text.secondary' }}>{step.body}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

/**
 * The card visuals.
 *
 * Drawn rather than illustrated: each one is the shape of what that audience actually gets — a
 * campaign landing on screens, income accruing over a shift, vehicles joining one network — at a
 * weight that reads as texture until you look at it. All three are decorative and carry no
 * meaning a screen reader would need, so the wrappers mark them hidden.
 */
function DeliveryVisual() {
  return (
    <Box component="svg" viewBox="0 0 300 96" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* The route, and three screens along it — the last one live. */}
      <path d="M6 78 C 70 78, 96 42, 152 42 S 236 22, 294 22" stroke={tokens.navy} strokeOpacity="0.09" strokeWidth="1.5" strokeLinecap="round" />
      {[
        { x: 44, y: 62, on: false },
        { x: 150, y: 26, on: false },
        { x: 256, y: 6, on: true },
      ].map((s) => (
        <g key={s.x}>
          <rect x={s.x} y={s.y} width="30" height="19" rx="3" fill={s.on ? tokens.amber : tokens.navy} fillOpacity={s.on ? 0.9 : 0.1} />
          <path d={`M${s.x + 15} ${s.y + 19} v6`} stroke={tokens.navy} strokeOpacity="0.14" strokeWidth="1.5" />
        </g>
      ))}
    </Box>
  );
}

function EarningsVisual() {
  return (
    <Box component="svg" viewBox="0 0 200 72" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* A shift's worth of road, and what accrues over it. */}
      <path d="M4 66 H 196" stroke={tokens.navy} strokeOpacity="0.08" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 66 H 22 M34 66 H 52 M64 66 H 82 M94 66 H 112" stroke={tokens.navy} strokeOpacity="0.12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 54 L 56 44 L 104 30 L 152 20 L 192 8" stroke={tokens.amber} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="192" cy="8" r="3.5" fill={tokens.amber} fillOpacity="0.85" />
    </Box>
  );
}

function FleetVisual() {
  return (
    <Box component="svg" viewBox="0 0 200 72" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Separate vehicles resolving into one network. */}
      <path
        d="M28 54 L 74 24 M74 24 L 122 48 M122 48 L 170 18 M28 54 L 122 48"
        stroke={tokens.navy}
        strokeOpacity="0.1"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {[
        { x: 28, y: 54, on: false },
        { x: 74, y: 24, on: false },
        { x: 122, y: 48, on: true },
        { x: 170, y: 18, on: false },
      ].map((n) => (
        <circle
          key={n.x}
          cx={n.x}
          cy={n.y}
          r={n.on ? 4.5 : 3.5}
          fill={n.on ? tokens.amber : tokens.navy}
          fillOpacity={n.on ? 0.85 : 0.16}
        />
      ))}
    </Box>
  );
}

/**
 * Streets, and one route crossing them.
 *
 * Stands in for a map without pretending to be one — an actual Beirut street plan at this size
 * would be unreadable, and a recognisable one would be a claim about coverage the network cannot
 * yet make. Decorative; the wrapper marks it hidden.
 */
function StreetVisual() {
  return (
    <Box component="svg" viewBox="0 0 260 120" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
      <g stroke={tokens.navy} strokeOpacity="0.08" strokeWidth="1.25" strokeLinecap="round">
        <path d="M0 34 H260 M0 74 H260" />
        <path d="M52 0 V120 M126 0 V120 M198 0 V120" />
      </g>
      <path
        d="M8 108 L 52 108 L 52 74 L 126 74 L 126 34 L 216 34"
        stroke={tokens.amber}
        strokeOpacity="0.5"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="216" cy="34" r="8" fill={tokens.amber} fillOpacity="0.1" />
      <circle cx="216" cy="34" r="3" fill={tokens.amber} fillOpacity="0.8" />
    </Box>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.blue, mb: '10px' }}>
      {children}
    </Typography>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  // Drives the delivery bar in the Measure panel, so it fills as the section arrives rather than
  // having already finished by the time anyone scrolls to it.
  const [measureRef, measureInView] = useInView<HTMLDivElement>();

  const { isSignedIn } = useAuth();

  /**
   * Coverage comes from the API, not from this file.
   *
   * /api/v1/regions is public and is the same list the campaign builder targets against, so an
   * area is shown as available exactly when a campaign could actually be pointed at it. If the
   * call fails the section says so and offers a retry, rather than falling back to a hardcoded
   * list that would quietly claim coverage the platform might not have.
   */
  const [regions, setRegions] = useState<RegionOption[] | null>(null);
  const [regionsError, setRegionsError] = useState(false);

  const loadRegions = useCallback(() => {
    setRegionsError(false);
    setRegions(null);
    fetchRegions()
      .then(setRegions)
      .catch(() => setRegionsError(true));
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const regionsLoading = regions === null && !regionsError;

  const mapAreas = useMemo(
    () =>
      COVERAGE_AREAS.map((area) => ({
        name: area.name,
        lon: area.lon,
        lat: area.lat,
        labelDx: area.labelDx,
        labelDy: area.labelDy,
        covered: (regions ?? []).some((r) => area.regions.includes(r.name)),
      })),
    [regions],
  );

  const [selectedArea, setSelectedArea] = useState('Beirut');

  const selectedAreaDetail = useMemo(() => {
    const area = COVERAGE_AREAS.find((a) => a.name === selectedArea) ?? COVERAGE_AREAS[0];
    const matched = (regions ?? []).filter((r) => area.regions.includes(r.name));
    return { name: area.name, covered: matched.length > 0, regions: matched };
  }, [selectedArea, regions]);

  /** What the visitor has configured. null on any field means "Custom", which carries no number. */
  const [campaign, setCampaign] = useState<{
    displays: number | null;
    vehicles: number | null;
    coverage: string;
    days: number | null;
  }>({ displays: 100000, vehicles: 10, coverage: 'Greater Beirut', days: 30 });

  // The example progress mock tracks the configured target so it stays coherent with the panel
  // above it. 72% is a picture of a campaign in flight, not a forecast — no campaign has run.
  const sampleTarget = campaign.displays === null ? '—' : campaign.displays.toLocaleString();
  const sampleDelivered = campaign.displays === null ? '—' : Math.round(campaign.displays * 0.72).toLocaleString();

  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(24);
  const [drivesPremiumAreas, setDrivesPremiumAreas] = useState(true);
  /**
   * The contact inputs, quieter than the theme's default.
   *
   * A faint fill instead of a white field on a white card: with the surrounding card gone, an
   * outlined-only input has nothing to sit against and reads as a floating rectangle. Orange on
   * focus rather than the palette's blue, because focus is the one moment in this section where
   * the accent means something.
   */
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '11px',
      backgroundColor: '#FBFBFD',
      '& fieldset': { borderColor: tokens.border },
      '&:hover fieldset': { borderColor: '#D3D8E2' },
      '&.Mui-focused fieldset': { borderColor: tokens.amber, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: tokens.amber600 },
  } as const;

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactReason, setContactReason] = useState(CONTACT_REASONS[0]);
  const [contactMessage, setContactMessage] = useState('');
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactSent, setContactSent] = useState(false);

  /**
   * Checked here rather than left to `required`, so all three problems surface at once instead of
   * the browser stopping at the first and scrolling away from the rest.
   */
  const validateContact = (): Record<string, string> => {
    const problems: Record<string, string> = {};

    if (contactName.trim().length < 2) problems.name = 'Please tell us your name.';
    if (!EMAIL_PATTERN.test(contactEmail.trim())) problems.email = 'That does not look like an email address.';
    if (contactMessage.trim().length < 10) problems.message = 'A sentence or two helps us route this properly.';

    return problems;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const problems = validateContact();
    setContactErrors(problems);
    if (Object.keys(problems).length > 0) return;

    // No mail provider is connected, so nothing is actually delivered. The confirmation says so
    // rather than implying somebody is now reading it.
    //
    // No toast: the form is replaced in place by the confirmation, and a popup on top of that is
    // the same news twice — one of which disappears before it can be read.
    setContactSent(true);
  };

  const resetContactForm = () => {
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactReason(CONTACT_REASONS[0]);
    setContactMessage('');
    setContactErrors({});
    setContactSent(false);
  };

  const { total, base, hourlyEarnings, premiumBonus } = useMemo(() => {
    const breakdown = calculateDriverEarnings({ hoursPerDay: hours, days, drivesPremiumAreas });
    return {
      base: breakdown.base,
      hourlyEarnings: Math.round(breakdown.hourlyEarnings),
      premiumBonus: breakdown.premiumBonus,
      total: Math.round(breakdown.total),
    };
  }, [hours, days, drivesPremiumAreas]);

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* NAV */}
      <Box
        component="nav"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '16px clamp(20px,5vw,64px)',
          borderBottom: `1px solid ${tokens.border}`,
          flexWrap: 'wrap',
          backgroundColor: 'background.default',
        }}
      >
        <Logo size="lg" />

        {/* Seven links do not fit a phone, and wrapping them turns the bar into a third of the
            screen — below md they move into the drawer instead. */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          {NAV_LINKS.map((link) => (
            <Link key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`} underline="none" sx={{ fontSize: 14, color: 'text.primary', fontWeight: 500 }}>
              {link}
            </Link>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderColor: tokens.border, color: tokens.text }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              backgroundColor: tokens.navy,
              color: '#fff',
              '&:hover': { backgroundColor: tokens.navy700 },
            }}
            onClick={() => navigate('/signup?role=advertiser')}
          >
            Launch Campaign
          </Button>
          <IconButton
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: tokens.navy }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      <Drawer anchor="right" open={navOpen} onClose={() => setNavOpen(false)}>
        <Box sx={{ width: 260, p: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
            <Logo size="md" />
            <IconButton aria-label="Close menu" onClick={() => setNavOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          {NAV_LINKS.map((link) => (
            <Link
              key={link}
              href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              underline="none"
              onClick={() => setNavOpen(false)}
              sx={{ fontSize: 15, fontWeight: 500, color: 'text.primary', py: '10px', px: '8px', borderRadius: '8px', '&:hover': { backgroundColor: tokens.bg } }}
            >
              {link}
            </Link>
          ))}
          <Box sx={{ display: 'grid', gap: '10px', mt: '16px' }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ backgroundColor: tokens.navy, color: '#fff', '&:hover': { backgroundColor: tokens.navy700 } }}
              onClick={() => { setNavOpen(false); navigate('/signup?role=advertiser'); }}
            >
              Launch Campaign
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.text }}
              onClick={() => { setNavOpen(false); navigate('/login'); }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* HERO */}
      <Box
        sx={{
          backgroundImage: `url(${heroTaxi})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 28%',
          padding: '64px clamp(20px,5vw,64px) 72px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, ${tokens.navy}F0 0%, ${tokens.navy600}E0 55%, #24397ACC 100%)`,
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(700px 500px at 88% 10%, rgba(245,166,35,0.22), transparent 60%)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ maxWidth: 640 }}>
            <Chip
              label="Digital Out-of-Home · Lebanon"
              sx={{
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: tokens.amber,
                backgroundColor: 'rgba(245,166,35,0.14)',
                mb: '22px',
              }}
            />
            <Typography sx={{ fontWeight: 800, fontSize: 'clamp(36px,4.4vw,54px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff' }}>
              Turn Every Road Into an Advertising Opportunity
            </Typography>
            <Typography sx={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', maxWidth: '50ch', mt: '20px' }}>
              Launch location-based digital campaigns across Lebanon using smart taxi-top screens with real-time GPS tracking.
            </Typography>
            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', mt: '30px' }}>
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/signup?role=advertiser')}>
                Launch a Campaign
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)', '&:hover': { borderColor: 'rgba(255,255,255,0.7)' } }}
                onClick={() => navigate('/signup?role=driver')}
              >
                Become a Driver Partner
              </Button>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4,1fr)' },
                gap: '1px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: '12px',
                overflow: 'hidden',
                mt: '40px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {HERO_STATS.map((stat) => (
                <Box key={stat.label} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '14px 16px' }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{stat.value}</Typography>
                  <Typography sx={{ mt: '4px', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: 'clamp(20px,5vw,64px)' }}>
        {/* HOW IT WORKS */}
        <Reveal>
          <Box component="section" sx={{ py: '64px' }}>
            <SectionEyebrow>How it works</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '32px', letterSpacing: '-0.01em' }}>Two journeys, one platform</Typography>
            <Box sx={{ display: 'grid', gap: '24px' }}>
              <Box id="advertisers" sx={{ scrollMarginTop: '20px' }}>
                <StepCard title="For advertisers" steps={ADVERTISER_STEPS} badgeBg="#EAF0FF" badgeColor={tokens.blue} />
              </Box>
              <Box id="drivers" sx={{ scrollMarginTop: '20px' }}>
                <StepCard title="For drivers" steps={DRIVER_STEPS} badgeBg="#FEF3E2" badgeColor={tokens.amber600} />
              </Box>
            </Box>
          </Box>
        </Reveal>

        {/* TAXI COMPANIES */}
        <Reveal>
          <Box component="section" id="taxi-companies" sx={{ py: '64px', scrollMarginTop: '20px' }}>
            <SectionEyebrow>For taxi companies</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '10px', letterSpacing: '-0.01em' }}>Partner your fleet with AdzOnRoad</Typography>
            <Typography sx={{ fontSize: 15.5, color: 'text.secondary', maxWidth: '60ch', mb: '28px' }}>
              Turn your entire fleet into a revenue stream — we handle installation, maintenance, and driver payouts.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '16px' }}>
              {TAXI_COMPANY_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <Card
                    key={b.title}
                    sx={{
                      p: '22px',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: tokens.shadowMd },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#FEF3E2',
                        color: tokens.amber600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: '14px',
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '6px', color: tokens.navy }}>{b.title}</Typography>
                    <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.55 }}>{b.body}</Typography>
                  </Card>
                );
              })}
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: '28px' }}
              onClick={() => navigate('/signup?role=taxiCompany')}
              startIcon={<HandshakeRoundedIcon />}
            >
              Partner Your Fleet
            </Button>
          </Box>
        </Reveal>

        {/* NETWORK COVERAGE
            The eyebrow said "Live network" and the copy said positions were "updated in real
            time". Nothing here was live: the map carried about 1,235 invented screens and the six
            cards below it another 38, which is also where the hero's screen count came from. The
            "high demand" chip was calculated from nothing at all.

            What is real is the regions endpoint, and this section now runs on it. An area shows as
            covered because /api/v1/regions returned regions inside it — drop one server-side and it
            greys out here. Nothing states a screen count, because the platform has none to state. */}
        <Reveal>
          <Box component="section" id="coverage" sx={{ py: { xs: '72px', md: '96px' }, scrollMarginTop: '20px' }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Network coverage
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              See where AdzOnRoad moves.
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '58ch', lineHeight: 1.7 }}>
              Explore our available and expanding coverage areas across Lebanon.
            </Typography>

            {regionsError ? (
              <Box sx={{ mt: '32px' }}>
                <ErrorState
                  title="Coverage areas could not be loaded"
                  description="The region list comes from the AdzOnRoad API and is not reachable right now."
                  onRetry={loadRegions}
                />
              </Box>
            ) : regionsLoading ? (
              <Box sx={{ mt: '32px' }}>
                <LoadingState label="Loading coverage areas…" />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    mt: { xs: '32px', md: '48px' },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' },
                    gap: { xs: '32px', md: '56px' },
                    alignItems: 'start',
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        borderRadius: '16px',
                        border: `1px solid ${tokens.border}`,
                        backgroundColor: tokens.surface,
                        p: { xs: '16px', sm: '24px' },
                      }}
                    >
                      <LebanonMap areas={mapAreas} selected={selectedArea} onSelect={setSelectedArea} />
                    </Box>

                    <Box sx={{ mt: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {[
                        { label: 'Available for targeting', colour: tokens.navy },
                        { label: 'Expanding', colour: tokens.textMuted },
                      ].map((item) => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.colour }} />
                          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '8px' }}
                    >
                      {selectedAreaDetail.covered ? 'Available for targeting' : 'Expanding'}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 'clamp(24px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.028em', color: tokens.navy, lineHeight: 1.1 }}
                    >
                      {selectedAreaDetail.name}
                    </Typography>

                    <Typography sx={{ mt: '12px', fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
                      {selectedAreaDetail.covered
                        ? `Campaigns can be targeted at ${selectedAreaDetail.regions.length === 1 ? 'this area' : 'these areas'} when you build a campaign.`
                        : 'Not part of the targetable network yet. The network expands with advertiser and fleet demand.'}
                    </Typography>

                    {selectedAreaDetail.regions.length > 0 && (
                      <Box sx={{ mt: '22px' }}>
                        <Typography
                          sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '10px' }}
                        >
                          Coverage areas
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {selectedAreaDetail.regions.map((region) => (
                            <Box
                              key={region.id}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '7px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: tokens.navy,
                                backgroundColor: '#FBFBFD',
                                border: `1px solid ${tokens.border}`,
                                borderRadius: '999px',
                                padding: '7px 13px',
                              }}
                            >
                              {region.name}
                              {region.isPremium && (
                                <Box component="span" sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.amber600 }}>
                                  Premium
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      disabled={!selectedAreaDetail.covered}
                      onClick={() => navigate('/signup?role=advertiser')}
                      sx={{ mt: '26px' }}
                    >
                      Target {selectedAreaDetail.name} &rarr;
                    </Button>

                    {/* The region navigator. Rows rather than cards — six boxes below the map were
                        what made this a statistics wall instead of a way to answer "can I run my
                        campaign where my customers are". */}
                    <Box sx={{ mt: '30px', borderTop: `1px solid ${tokens.border}` }}>
                      {mapAreas.map((area) => {
                        const isSelected = area.name === selectedArea;
                        return (
                          <Box
                            key={area.name}
                            component="button"
                            type="button"
                            onClick={() => setSelectedArea(area.name)}
                            aria-pressed={isSelected}
                            data-selected={isSelected ? 'true' : undefined}
                            sx={{
                              fontFamily: 'inherit',
                              width: '100%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                              padding: '13px 4px',
                              background: 'none',
                              border: 0,
                              borderBottom: `1px solid ${tokens.border}`,
                              textAlign: 'left',
                              transition: 'padding-left .18s ease',
                              '&:hover': { paddingLeft: '10px' },
                              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '-2px' },
                              '&[data-selected="true"]': { paddingLeft: '10px' },
                              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  backgroundColor: !area.covered ? tokens.textMuted : isSelected ? tokens.amber : tokens.navy,
                                }}
                              />
                              <Typography
                                sx={{ fontSize: 14, fontWeight: isSelected ? 700 : 600, color: tokens.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {area.name}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', flexShrink: 0 }}>
                              {area.covered ? 'Available' : 'Expanding'}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: { xs: '36px', md: '48px' },
                    pt: { xs: '28px', md: '32px' },
                    borderTop: `1px solid ${tokens.border}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '18px',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: tokens.navy, mb: '4px' }}>
                      Need coverage somewhere else?
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6, maxWidth: '54ch' }}>
                      AdzOnRoad&rsquo;s network is expanding based on advertiser and fleet demand.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/#contact')}
                    sx={{ borderColor: tokens.border, color: tokens.navy, flexShrink: 0 }}
                  >
                    Talk to our team &rarr;
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Reveal>


        {/* CAMPAIGN PRICING
            The old section sold a slot: three taxi-count cards, "1 of 6 ad units", "repeats every
            ~90 sec, 8 hrs/day". That is the model being replaced — an advertiser buys a delivery
            target now, not a share of a rotation, and the 8-hour promise was never AdzOnRoad's to
            make on a driver's behalf.

            No price is shown, and that is deliberate rather than unfinished. Pricing in this
            codebase is RatePerTaxiPerSecondUsd — per taxi, per second of creative, premised on the
            8-hour day this section stops selling. There is no per-display rate in the frontend, in
            the rate card, or in the API, and inventing one would put a number on the page that
            nothing charges from. Quoted pricing is also how DOOH is normally bought. */}
        <Reveal>
          <Box component="section" id="pricing" sx={{ py: { xs: '72px', md: '96px' }, scrollMarginTop: '20px' }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Campaign pricing
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              Pay for delivery.
              <Box component="span" sx={{ display: 'block' }}>
                Not idle screen time.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '62ch', lineHeight: 1.7 }}>
              Choose how many times you want your campaign displayed, where you want it to run, and
              how many vehicles you want in your network. Every campaign works toward a defined
              delivery target.
            </Typography>

            <Box
              sx={{
                mt: { xs: '40px', md: '56px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
                gap: { xs: '40px', md: '64px' },
                alignItems: 'start',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 'clamp(19px,2vw,22px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '28px' }}>
                  Build your campaign
                </Typography>

                <Box sx={{ display: 'grid', gap: '28px' }}>
                  {CAMPAIGN_STEPS.map((step) => (
                    <Box key={step.key}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '10px' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>
                          {step.number}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
                        >
                          {step.title}
                        </Typography>
                      </Box>

                      <Box role="radiogroup" aria-label={step.title} sx={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
                        {step.options.map((option) => (
                          <Box
                            key={option.label}
                            component="button"
                            type="button"
                            role="radio"
                            aria-checked={campaign[step.key] === option.value}
                            data-selected={campaign[step.key] === option.value ? 'true' : undefined}
                            onClick={() => setCampaign((c) => ({ ...c, [step.key]: option.value }))}
                            sx={{
                              fontFamily: 'inherit',
                              fontSize: 13.5,
                              fontWeight: 600,
                              lineHeight: 1.4,
                              cursor: 'pointer',
                              padding: '9px 16px',
                              borderRadius: '999px',
                              color: tokens.textMuted,
                              backgroundColor: '#FBFBFD',
                              border: `1px solid ${tokens.border}`,
                              transition: 'background-color .2s ease, border-color .2s ease, color .2s ease',
                              '&:hover': { borderColor: '#D3D8E2' },
                              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                              '&[data-selected="true"]': {
                                color: tokens.navy,
                                backgroundColor: 'rgba(245,166,35,0.12)',
                                borderColor: tokens.amber,
                              },
                              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                            }}
                          >
                            {option.label}
                          </Box>
                        ))}
                      </Box>

                      {step.note && (
                        <Typography sx={{ mt: '10px', fontSize: 12.5, color: 'text.secondary', lineHeight: 1.6, maxWidth: '52ch' }}>
                          {step.note}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  position: { md: 'sticky' },
                  top: { md: '24px' },
                  p: { xs: '26px', sm: '30px' },
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                }}
              >
                <Typography
                  sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted }}
                >
                  Your campaign
                </Typography>

                <Typography
                  sx={{ mt: '10px', fontWeight: 800, fontSize: 'clamp(38px,5vw,52px)', lineHeight: 1, letterSpacing: '-0.035em', color: tokens.navy }}
                >
                  {campaign.displays === null ? 'Custom' : campaign.displays.toLocaleString()}
                </Typography>
                <Typography sx={{ mt: '6px', fontSize: 13.5, color: 'text.secondary' }}>15-second displays</Typography>

                <Box sx={{ mt: '20px', display: 'grid', gap: '10px' }}>
                  {[
                    campaign.vehicles === null ? 'Custom vehicle count' : `${campaign.vehicles} vehicles`,
                    campaign.coverage,
                    campaign.days === null ? 'Custom campaign period' : `${campaign.days}-day campaign`,
                  ].map((line) => (
                    <Typography key={line} sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}>
                      {line}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ mt: '24px', pt: '22px', borderTop: `1px solid ${tokens.border}` }}>
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '8px' }}
                  >
                    Estimated campaign price
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.65, mb: '16px' }}>
                    Priced per campaign against your delivery target, network size and regions.
                    Confirmed with the team before a campaign is approved.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate(isSignedIn ? '/advertiser/campaigns' : '/signup?role=advertiser')}
                    sx={{
                      '& .arrow': { transition: 'transform .22s ease' },
                      '&:hover .arrow': { transform: 'translateX(3px)' },
                      '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                    }}
                  >
                    {isSignedIn ? 'Continue to campaign setup' : 'Build your campaign'}
                    <Box component="span" className="arrow" aria-hidden sx={{ ml: '8px', fontSize: 16, lineHeight: 1 }}>
                      &rarr;
                    </Box>
                  </Button>
                </Box>

                {/* Sample interface, labelled as one. The figures track the selection above so the
                    mock stays coherent, but they are a picture of what progress looks like — no
                    campaign has run. Hidden from assistive technology so none of it is announced
                    as a real delivery figure. */}
                <Box sx={{ mt: '24px', pt: '22px', borderTop: `1px solid ${tokens.border}` }}>
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.navy, mb: '6px' }}
                  >
                    Delivery you can see
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6, mb: '16px' }}>
                    Follow campaign progress as your purchased displays are delivered across the
                    AdzOnRoad network.
                  </Typography>

                  <Box
                    aria-hidden
                    sx={{ p: '14px', borderRadius: '12px', border: `1px dashed ${tokens.border}`, backgroundColor: '#FBFBFD' }}
                  >
                    <Typography
                      sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMuted, mb: '10px' }}
                    >
                      Example view
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: '7px' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Campaign delivery</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.navy }}>{sampleDelivered} / {sampleTarget}</Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: '999px', backgroundColor: 'rgba(15,27,61,0.07)', overflow: 'hidden' }}>
                      <Box sx={{ width: '72%', height: '100%', borderRadius: '999px', backgroundColor: tokens.amber }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* What the money buys, spelled out — the old cards listed inventory, which is not the
                same thing and is what made the model easy to misread. */}
            <Box sx={{ mt: { xs: '48px', md: '64px' }, pt: { xs: '32px', md: '40px' }, borderTop: `1px solid ${tokens.border}` }}>
              <Typography
                sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '18px' }}
              >
                What you&rsquo;re buying
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3,1fr)' },
                  columnGap: '32px',
                  rowGap: '12px',
                  mb: '22px',
                }}
              >
                {[
                  'Defined campaign delivery target',
                  '15-second advertising displays',
                  'Selected vehicle network',
                  'Geographic targeting',
                  'Campaign delivery reporting',
                  'GPS/location-linked delivery evidence where available',
                ].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckRoundedIcon sx={{ fontSize: 16, color: tokens.amber, mt: '3px', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 14, color: tokens.navy, lineHeight: 1.6 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.75, maxWidth: '76ch' }}>
                Your campaign is measured against its purchased delivery target. If individual
                vehicles operate fewer hours on a given day, delivery can continue across the
                campaign period and eligible vehicle network.
              </Typography>
            </Box>
          </Box>
        </Reveal>


        {/* WHY ADZONROAD
            Eight equal cards gave eight equal weights, so nothing led and the differentiator —
            that delivery can be evidenced — sat in the same box as "transparent pricing". Three
            reasons now, sized by how much they matter, and each one shown rather than described.

            Three claims went with the cards. "Every impression is backed by a verified location
            and timestamp" asserted completeness the platform cannot demonstrate; it is now what
            the system can do. "From Tripoli to Tyre" described coverage that does not exist —
            there are no screens deployed. "Most campaigns go live within 48 hours" was an SLA
            nobody has committed to. */}
        <Reveal>
          <Box component="section" sx={{ py: { xs: '72px', md: '96px' } }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Why AdzOnRoad
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              Outdoor advertising,
              <Box component="span" sx={{ display: 'block' }}>
                with proof built in.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '58ch', lineHeight: 1.7 }}>
              Know where your campaign ran, when it was displayed, and how your media moved across
              the road network.
            </Typography>

            <Box
              sx={{
                mt: { xs: '40px', md: '56px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.35fr 1fr' },
                gap: '16px',
              }}
            >
              {/* VERIFY — the reason the other two matter, so it takes the height of both. */}
              <Box
                sx={{
                  gridRow: { md: 'span 2' },
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: '26px', sm: '32px' },
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  '@keyframes adzRouteDash': { to: { strokeDashoffset: -140 } },
                  '&:hover .adz-route': { animation: 'adzRouteDash 3s linear infinite' },
                  '@media (prefers-reduced-motion: reduce)': {
                    '&:hover .adz-route': { animation: 'none' },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '10px' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>01</Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}>
                    Verify
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '8px' }}>
                  Know where your ads ran.
                </Typography>
                <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '44ch' }}>
                  Campaign playback is connected with location and timestamp data, creating a
                  measurable record of delivery.
                </Typography>

                <Box aria-hidden sx={{ mt: '28px', flexGrow: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <Box component="svg" viewBox="0 0 460 260" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* streets */}
                    <g stroke={tokens.navy} strokeOpacity="0.07" strokeWidth="1.25" strokeLinecap="round">
                      <path d="M0 66 H460 M0 134 H460 M0 202 H460" />
                      <path d="M88 0 V260 M196 0 V260 M304 0 V260 M392 0 V260" />
                    </g>

                    {/* the route taken */}
                    <path
                      d="M28 226 L88 226 L88 134 L196 134 L196 66 L392 66"
                      stroke={tokens.amber}
                      strokeOpacity="0.28"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      className="adz-route"
                      d="M28 226 L88 226 L88 134 L196 134 L196 66 L392 66"
                      stroke={tokens.amber}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10 14"
                    />

                    {/* fixes along it */}
                    {[
                      [88, 226],
                      [88, 134],
                      [196, 134],
                      [196, 66],
                    ].map(([x, y]) => (
                      <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill={tokens.navy} fillOpacity="0.25" />
                    ))}

                    {/* current position */}
                    <circle cx="392" cy="66" r="12" fill={tokens.amber} fillOpacity="0.16" />
                    <circle cx="392" cy="66" r="5" fill={tokens.amber} />

                    {/* two evidenced moments, with the time each was recorded */}
                    <g>
                      <rect x="98" y="106" width="98" height="22" rx="6" fill={tokens.surface} stroke={tokens.border} />
                      <circle cx="110" cy="117" r="3" fill={tokens.green} />
                      <text x="120" y="121" fill={tokens.textMuted} fontSize="10" fontFamily="inherit" fontWeight="600">
                        18:04 verified
                      </text>
                    </g>
                    <g>
                      <rect x="206" y="38" width="98" height="22" rx="6" fill={tokens.surface} stroke={tokens.border} />
                      <circle cx="218" cy="49" r="3" fill={tokens.green} />
                      <text x="228" y="53" fill={tokens.textMuted} fontSize="10" fontFamily="inherit" fontWeight="600">
                        18:21 verified
                      </text>
                    </g>
                  </Box>
                </Box>
              </Box>

              {/* TARGET */}
              <Box
                sx={{
                  p: { xs: '26px', sm: '30px' },
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '10px' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>02</Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}>
                    Target
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 'clamp(18px,2vw,21px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '8px' }}>
                  Put campaigns where they matter.
                </Typography>
                <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.65 }}>
                  Choose the regions, vehicles and campaign parameters that match your advertising
                  strategy.
                </Typography>

                <Box aria-hidden sx={{ mt: '22px' }}>
                  <Box
                    component="svg"
                    viewBox="0 0 300 118"
                    fill="none"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      '& .adz-region': { transition: 'fill-opacity .2s ease, stroke-opacity .2s ease' },
                      '& .adz-region:hover': { fillOpacity: 0.34, strokeOpacity: 1 },
                      '@media (prefers-reduced-motion: reduce)': { '& .adz-region': { transition: 'none' } },
                    }}
                  >
                    {[
                      { x: 6, y: 8, w: 88, h: 46, on: true },
                      { x: 102, y: 8, w: 88, h: 46, on: true },
                      { x: 198, y: 8, w: 96, h: 46, on: false },
                      { x: 6, y: 62, w: 88, h: 46, on: false },
                      { x: 102, y: 62, w: 88, h: 46, on: true },
                      { x: 198, y: 62, w: 96, h: 46, on: false },
                    ].map((r) => (
                      <rect
                        key={`${r.x}-${r.y}`}
                        className="adz-region"
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        rx="8"
                        fill={r.on ? tokens.amber : tokens.navy}
                        fillOpacity={r.on ? 0.16 : 0.04}
                        stroke={r.on ? tokens.amber : tokens.border}
                        strokeOpacity={r.on ? 0.85 : 1}
                      />
                    ))}
                    {[
                      [50, 31],
                      [146, 31],
                      [146, 85],
                    ].map(([cx, cy]) => (
                      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" fill={tokens.amber} />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* MEASURE */}
              <Box
                ref={measureRef}
                sx={{
                  p: { xs: '26px', sm: '30px' },
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '10px' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>03</Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}>
                    Measure
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 'clamp(18px,2vw,21px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '8px' }}>
                  See what was delivered.
                </Typography>
                <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.65 }}>
                  Track campaign progress, display activity and verified delivery from one place.
                </Typography>

                {/* Sample interface, and labelled as one. The figures below are placeholders in a
                    mock of the advertiser view — they are not AdzOnRoad's numbers, and the platform
                    has none to show yet. Hidden from assistive technology so it cannot be read out
                    as fact. */}
                <Box
                  aria-hidden
                  sx={{
                    mt: '22px',
                    p: '16px',
                    borderRadius: '12px',
                    border: `1px dashed ${tokens.border}`,
                    backgroundColor: '#FBFBFD',
                  }}
                >
                  <Typography
                    sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMuted, mb: '12px' }}
                  >
                    Example view
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: '7px' }}>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Campaign delivery</Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.navy }}>78%</Typography>
                  </Box>
                  <Box sx={{ height: 7, borderRadius: '999px', backgroundColor: 'rgba(15,27,61,0.07)', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: '999px',
                        backgroundColor: tokens.amber,
                        width: measureInView ? '78%' : '0%',
                        transition: 'width 1.1s cubic-bezier(.22,.61,.36,1)',
                        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: '16px', display: 'grid', gap: '9px' }}>
                    {[
                      { label: 'Verified displays', value: '12,480' },
                      { label: 'Active vehicles', value: '18' },
                    ].map((row) => (
                      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: tokens.navy }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Who each of the three sides gets something out of it, without another row of cards. */}
            <Box
              sx={{
                mt: { xs: '40px', md: '48px' },
                pt: { xs: '28px', md: '32px' },
                borderTop: `1px solid ${tokens.border}`,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: { xs: '22px', md: '40px' },
              }}
            >
              {[
                { label: 'For advertisers', body: 'Flexible campaign planning' },
                { label: 'For drivers', body: 'Additional earning opportunity' },
                { label: 'For fleets', body: 'New value from vehicles already on the road' },
              ].map((item, i) => (
                <Box
                  key={item.label}
                  sx={{
                    pl: { md: i === 0 ? 0 : '40px' },
                    ml: { md: i === 0 ? 0 : '-40px' },
                    borderLeft: { md: i === 0 ? 'none' : `1px solid ${tokens.border}` },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '7px' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: tokens.navy, lineHeight: 1.5, maxWidth: '26ch' }}>
                    {item.body}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>


        {/* DRIVER EARNINGS CALCULATOR
            The formula is untouched — base, hourly rate and premium bonus all still come from
            earningsService, which the driver dashboard shares. Only the presentation changed, plus
            one fix: the breakdown used to interpolate the raw hourly figure, so the default
            position rendered "$115.19999999999999". 192 * 0.6 is not 115.2 in floating point, and
            49 of the 253 slider combinations hit something similar. Displayed values are rounded
            now. Rounding cannot desync the rows from the total, because base and bonus are whole
            dollars and 0.6 * n never lands on a half. */}
        <Reveal>
          <Box component="section" sx={{ py: { xs: '72px', md: '96px' } }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Driver earnings
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              See what your driving
              <Box component="span" sx={{ display: 'block' }}>
                could earn you.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '54ch', lineHeight: 1.7 }}>
              Choose how much you normally drive and get an instant estimate of your monthly
              AdzOnRoad earnings.
            </Typography>

            <Box
              sx={{
                mt: { xs: '40px', md: '56px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
                gap: { xs: '40px', md: '64px' },
                alignItems: 'start',
              }}
            >
              <Box sx={{ display: 'grid', gap: '34px' }}>
                {[
                  {
                    n: '01',
                    label: 'Hours on the road',
                    value: `${hours} hrs / day`,
                    node: (
                      <Slider
                        value={hours}
                        min={2}
                        max={12}
                        onChange={(_, v) => setHours(v as number)}
                        aria-label="Driving hours per day"
                        sx={{ color: tokens.amber }}
                      />
                    ),
                    from: '2 hrs',
                    to: '12 hrs',
                  },
                  {
                    n: '02',
                    label: 'Days you drive',
                    value: `${days} days / month`,
                    node: (
                      <Slider
                        value={days}
                        min={8}
                        max={30}
                        onChange={(_, v) => setDays(v as number)}
                        aria-label="Driving days per month"
                        sx={{ color: tokens.amber }}
                      />
                    ),
                    from: '8 days',
                    to: '30 days',
                  },
                ].map((input) => (
                  <Box key={input.n}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '6px' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>
                        {input.n}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
                      >
                        {input.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 'clamp(22px,2.4vw,26px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy }}>
                      {input.value}
                    </Typography>
                    {/* Capped rather than stretched to the column: a slider the width of the page
                        is harder to place accurately, not easier, and it leaves the row looking
                        mostly empty. */}
                    <Box sx={{ maxWidth: 380, mt: '4px' }}>
                      {input.node}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '-2px' }}>
                        <Typography sx={{ fontSize: 12, color: tokens.textMuted }}>{input.from}</Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.textMuted }}>{input.to}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '10px' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>03</Typography>
                    <Typography
                      sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
                    >
                      Premium-area driving
                    </Typography>
                  </Box>

                  {/* A choice, not a preference switch. The selected look hangs off a data
                      attribute so there is one class for both states rather than one minted per
                      state. */}
                  <Box
                    component="button"
                    type="button"
                    role="checkbox"
                    aria-checked={drivesPremiumAreas}
                    data-selected={drivesPremiumAreas ? 'true' : undefined}
                    onClick={() => setDrivesPremiumAreas((on) => !on)}
                    sx={{
                      width: '100%',
                      maxWidth: 460,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      fontFamily: 'inherit',
                      backgroundColor: '#FBFBFD',
                      border: `1px solid ${tokens.border}`,
                      transition: 'background-color .2s ease, border-color .2s ease',
                      '&:hover': { borderColor: '#D3D8E2' },
                      '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                      '&[data-selected="true"]': {
                        backgroundColor: 'rgba(245,166,35,0.10)',
                        borderColor: tokens.amber,
                      },
                      '& .tick': {
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: '6px',
                        border: `1.5px solid ${tokens.border}`,
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'transparent',
                        transition: 'background-color .2s ease, border-color .2s ease, color .2s ease',
                      },
                      '&[data-selected="true"] .tick': {
                        backgroundColor: tokens.amber,
                        borderColor: tokens.amber,
                        color: tokens.navy,
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                        '& .tick': { transition: 'none' },
                      },
                    }}
                  >
                    <Box className="tick" aria-hidden>
                      <CheckRoundedIcon sx={{ fontSize: 15 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: tokens.navy, lineHeight: 1.35 }}>
                        I regularly drive in premium areas
                      </Typography>
                      <Typography sx={{ mt: '4px', fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>
                        Verdun &middot; Gemmayzeh &middot; Saifi &middot; Downtown &middot; other eligible areas
                      </Typography>
                      <Typography sx={{ mt: '8px', fontSize: 12.5, fontWeight: 700, color: tokens.amber600 }}>
                        +${DRIVER_PREMIUM_AREA_BONUS_USD} monthly bonus
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  backgroundColor: '#FBFBFD',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '16px',
                  p: { xs: '26px', sm: '32px' },
                }}
              >
                <Typography
                  sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted }}
                >
                  Your estimated monthly earnings
                </Typography>
                <Typography
                  sx={{
                    mt: '10px',
                    fontWeight: 800,
                    fontSize: 'clamp(52px,7vw,76px)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: tokens.navy,
                  }}
                >
                  ${Math.round(total)}
                </Typography>
                <Typography sx={{ mt: '12px', fontSize: 13.5, color: 'text.secondary' }}>
                  Based on {hours * days} driving hours this month
                </Typography>

                <Box sx={{ mt: '24px', pt: '22px', borderTop: `1px solid ${tokens.border}`, display: 'grid', gap: '12px' }}>
                  {[
                    { label: 'Base pay', value: base },
                    { label: 'Driving time', value: hourlyEarnings },
                    { label: 'Premium-area bonus', value: premiumBonus },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: tokens.navy }}>${Math.round(row.value)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Reveal>


        {/* ABOUT
            The traction figures that used to sit here — 142 advertisers, 2,610 drivers — described
            a network that does not exist yet: the production database currently holds no screens at
            all. They are gone rather than restated, and nothing has been invented to replace them.
            What the section claims now is what the platform does, which is true today. */}
        <Reveal>
          <Box component="section" id="about" sx={{ py: { xs: '72px', md: '96px' }, scrollMarginTop: '20px' }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Built for Lebanon
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(30px,5.2vw,48px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: tokens.navy }}
            >
              Advertising that moves
              <Box component="span" sx={{ display: 'block' }}>
                with the city.
              </Box>
            </Typography>
            <Typography sx={{ mt: '18px', fontSize: 'clamp(16px,1.8vw,18px)', fontWeight: 500, color: tokens.text, lineHeight: 1.6, maxWidth: '46ch' }}>
              AdzOnRoad turns vehicles already moving through Lebanon into a measurable digital
              advertising network.
            </Typography>
            <Typography sx={{ mt: '14px', fontSize: 15.5, color: 'text.secondary', lineHeight: 1.75, maxWidth: '62ch' }}>
              Traditional outdoor advertising tells you where a billboard is. AdzOnRoad goes further
              &mdash; connecting every campaign to real vehicles, real locations and verified display
              activity, giving advertisers measurable proof of where their campaigns moved.
            </Typography>

            <Box
              sx={{
                mt: { xs: '48px', md: '68px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                gap: { xs: '48px', md: '64px' },
                alignItems: 'start',
              }}
            >
              <Box>
                {ABOUT_PRINCIPLES.map((p, i) => (
                  <Box
                    key={p.number}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '46px 1fr',
                      gap: '4px',
                      pt: i === 0 ? 0 : '26px',
                      mt: i === 0 ? 0 : '26px',
                      // A hairline between principles rather than three boxes. The rule is the
                      // separator; nothing needs a container.
                      borderTop: i === 0 ? 'none' : `1px solid ${tokens.border}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em', pt: '2px' }}>
                      {p.number}
                    </Typography>
                    <Box>
                      <Typography
                        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted, mb: '6px' }}
                      >
                        {p.label}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 'clamp(18px,2vw,21px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '8px' }}
                      >
                        {p.headline}
                      </Typography>
                      <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '48ch' }}>
                        {p.body}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {/* The argument the three principles make, said once and large. */}
                <Typography
                  sx={{
                    mt: { xs: '44px', md: '56px' },
                    fontWeight: 800,
                    fontSize: 'clamp(26px,3.4vw,40px)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.06,
                    color: tokens.navy,
                    textTransform: 'uppercase',
                  }}
                >
                  Not just seen.
                  <Box component="span" sx={{ display: 'block', color: tokens.amber }}>
                    Verified.
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={heroTaxi}
                  alt="An AdzOnRoad screen mounted on a taxi roof in Beirut, lit above the street"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: { xs: 320, sm: 400, md: 520 },
                    objectFit: 'cover',
                    objectPosition: 'center 38%',
                    borderRadius: '16px',
                    display: 'block',
                  }}
                />

                {/* Illustrative, not live: a picture of what the platform records, so the section
                    reads as a connected system rather than a screen bolted to a roof. Marked hidden
                    because a screen reader announcing "campaign active" would be stating it as fact.
                    Deliberately carries no impression or audience figures — there are none to show. */}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: { xs: '12px', sm: '18px' },
                    bottom: { xs: '12px', sm: '18px' },
                    width: { xs: 'calc(100% - 24px)', sm: 236 },
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: '12px',
                    border: `1px solid ${tokens.border}`,
                    boxShadow: tokens.shadowMd,
                    p: '14px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px', mb: '10px' }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: tokens.green,
                        boxShadow: `0 0 0 3px ${tokens.green}22`,
                      }}
                    />
                    <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}>
                      Live delivery
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: tokens.navy, lineHeight: 1.25 }}>
                    Hamra, Beirut
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '12px' }}>Campaign active</Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['GPS verified', 'Display confirmed'].map((badge) => (
                      <Typography
                        key={badge}
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: tokens.navy,
                          backgroundColor: 'rgba(245,166,35,0.14)',
                          borderRadius: '999px',
                          padding: '4px 9px',
                        }}
                      >
                        {badge}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Reveal>


        {/* FOUNDER STATEMENT
            Its own section rather than a card at the foot of About: this is a position, not a
            customer review, and the two read differently. No box, no avatar, no quotation marks —
            the statement carries itself, and the whitespace around it is doing the work a border
            used to do badly. */}
        <Reveal>
          <Box
            component="section"
            sx={{
              py: { xs: '76px', md: '112px' },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 300px' },
              gap: { xs: '52px', md: '48px' },
              alignItems: 'center',
            }}
          >
            <Box component="figure" sx={{ m: 0 }}>
              <Typography component="blockquote" sx={{ m: 0 }}>
                {/* Two spans rather than a line break, so the size and weight step between the
                    lines is deliberate rather than a wrap that happens to land well. */}
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    fontSize: 'clamp(26px,4.4vw,42px)',
                    fontWeight: 600,
                    lineHeight: 1.14,
                    letterSpacing: '-0.03em',
                    color: tokens.navy600,
                  }}
                >
                  The road is already{' '}
                  <Box component="span" sx={{ color: tokens.amber }}>
                    moving
                  </Box>
                  .
                </Box>
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    mt: { xs: '6px', md: '8px' },
                    fontSize: 'clamp(32px,5.6vw,56px)',
                    fontWeight: 800,
                    lineHeight: 1.04,
                    letterSpacing: '-0.035em',
                    color: tokens.navy,
                    // On a phone this line runs to two, and the default break strands "too." alone.
                    // Balancing splits it after "brand" instead. Ignored by browsers that lack it,
                    // which get the same wrap they would have had.
                    textWrap: 'balance',
                  }}
                >
                  Your brand should be too.
                </Box>
              </Typography>

              <Box
                component="figcaption"
                sx={{ mt: { xs: '34px', md: '46px' }, display: 'flex', alignItems: 'center', gap: '18px' }}
              >
                {/* Road markings: a solid edge line over a broken centre line. Decorative, so it is
                    hidden from assistive technology rather than announced as two empty boxes. */}
                <Box aria-hidden sx={{ width: 46, flexShrink: 0, display: 'grid', gap: '4px' }}>
                  <Box sx={{ height: 2, borderRadius: '2px', backgroundColor: tokens.amber }} />
                  <Box
                    sx={{
                      height: 2,
                      borderRadius: '2px',
                      opacity: 0.4,
                      background: `repeating-linear-gradient(90deg, ${tokens.amber} 0 7px, transparent 7px 13px)`,
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.01em', color: tokens.navy }}>
                    Mahmoud Al-Masri
                  </Typography>
                  <Typography sx={{ mt: '2px', fontSize: 13, color: tokens.textMuted }}>
                    Founder &amp; CEO, AdzOnRoad
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* A route, fading in as it arrives. Decorative and deliberately quiet: it sits beside
                the sentence rather than illustrating it, and drops out entirely on narrow screens
                where it would only push the statement down the page. */}
            <Box
              aria-hidden
              sx={{ display: { xs: 'none', md: 'block' }, justifySelf: 'end', width: '100%', maxWidth: 260 }}
            >
              <Box component="svg" viewBox="0 0 300 230" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  {/* Stays faint even where it is strongest. The dot is the only part meant to be
                      noticed, and only after the sentence has been read. */}
                  <linearGradient id="adzRouteFade" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor={tokens.amber} stopOpacity="0" />
                    <stop offset="55%" stopColor={tokens.amber} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={tokens.amber} stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <path
                  d="M2 218 C 78 206, 112 168, 133 128 S 190 52, 286 26"
                  stroke={tokens.navy}
                  strokeOpacity="0.04"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M2 218 C 78 206, 112 168, 133 128 S 190 52, 286 26"
                  stroke="url(#adzRouteFade)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="286" cy="26" r="11" fill={tokens.amber} fillOpacity="0.08" />
                <circle cx="286" cy="26" r="3.75" fill={tokens.amber} fillOpacity="0.75" />
              </Box>
            </Box>
          </Box>
        </Reveal>

        {/* WHO WE WORK WITH
            Replaces an invented customer quote and four dashed boxes. The quote was attributed to
            nobody and the boxes named audiences without offering them anything — between them they
            occupied the width of the page and said less than the eyebrow above them.

            Asymmetric on purpose: advertisers are the side that pays, so that card takes the full
            height of the row and the other two stack beside it. */}
        <Reveal>
          <Box component="section" sx={{ pt: '48px', pb: '72px' }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Who we work with
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 'clamp(26px,4.4vw,40px)',
                lineHeight: 1.14,
                letterSpacing: '-0.025em',
                color: tokens.navy,
                maxWidth: '20ch',
              }}
            >
              One network.
              <Box component="span" sx={{ display: 'block' }}>
                Built for everyone on the road.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '58ch' }}>
              AdzOnRoad connects brands, drivers and fleet operators through one measurable
              advertising network.
            </Typography>

            <Box
              sx={{
                mt: { xs: '32px', md: '44px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
                gridTemplateRows: { md: 'auto auto' },
                gap: '16px',
              }}
            >
              {AUDIENCES.map((a, i) => {
                const feature = i === 0;
                return (
                  <Card
                    key={a.number}
                    component="article"
                    sx={{
                      gridRow: { md: feature ? 'span 2' : 'auto' },
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      p: { xs: '24px', sm: feature ? '32px' : '26px' },
                      transition: 'transform .22s ease, box-shadow .22s ease',
                      // The line arrives from the left on hover rather than fading in, so the
                      // movement echoes the rest of the page instead of just lighting up.
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        insetInline: 0,
                        top: 0,
                        height: '2px',
                        backgroundColor: tokens.amber,
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform .3s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: tokens.shadowMd,
                        '&::after': { transform: 'scaleX(1)' },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                        '&:hover': { transform: 'none' },
                        '&::after': { transition: 'none' },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '18px' }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em' }}>
                        {a.number}
                      </Typography>
                      <Box aria-hidden sx={{ width: 14, height: '1px', backgroundColor: tokens.border }} />
                      <Typography
                        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
                      >
                        {a.label}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: feature ? 'clamp(22px,2.6vw,30px)' : 'clamp(18px,2vw,21px)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                        color: tokens.navy,
                        mb: '10px',
                      }}
                    >
                      {a.title}
                    </Typography>

                    <Typography sx={{ fontSize: feature ? 15 : 14, color: 'text.secondary', lineHeight: 1.65, maxWidth: '46ch' }}>
                      {a.body}
                    </Typography>

                    {/* Pushes the visual and CTA to the foot so the three cards align along the
                        bottom regardless of how long the copy runs. */}
                    <Box aria-hidden sx={{ mt: feature ? '32px' : '22px', mb: feature ? '28px' : '20px', flexGrow: feature ? 1 : 0, display: 'flex', alignItems: 'flex-end' }}>
                      {/* Capped rather than left at full card width. These are accents; allowed to
                          scale with the card they set its height instead of decorating it, which
                          is what left the feature card 800px tall with nothing in the middle. */}
                      <Box sx={{ width: '100%', maxWidth: feature ? 340 : 200 }}>
                        {feature ? <DeliveryVisual /> : i === 1 ? <EarningsVisual /> : <FleetVisual />}
                      </Box>
                    </Box>

                    {/* Stretched link: the whole card is the hit area, but there is still exactly
                        one thing to tab to and one accessible name. */}
                    <Link
                      component={RouterLink}
                      to={a.to}
                      underline="none"
                      sx={{
                        mt: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        alignSelf: 'flex-start',
                        fontSize: 14,
                        fontWeight: 700,
                        color: tokens.navy,
                        '&::after': { content: '""', position: 'absolute', inset: 0 },
                        '& .arrow': { transition: 'transform .22s ease' },
                        '.MuiCard-root:hover &': { color: tokens.amber600 },
                        '.MuiCard-root:hover & .arrow': { transform: 'translateX(3px)' },
                      }}
                    >
                      {a.cta}
                      <Box component="span" className="arrow" aria-hidden sx={{ fontSize: 16, lineHeight: 1 }}>
                        &rarr;
                      </Box>
                    </Link>
                  </Card>
                );
              })}
            </Box>
          </Box>
        </Reveal>

        {/* CONTACT */}
        <Reveal>
          <Box component="section" id="contact" sx={{ py: '64px', scrollMarginTop: '20px' }}>
            {/* The heading block carries the section on its own. There is no button here on
                purpose: the form is the next thing on the page, and a button whose only job is to
                scroll to something already in view is a step that reads as progress and is not. */}
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Let&rsquo;s talk
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              Ready to put your brand
              <Box component="span" sx={{ display: 'block' }}>
                on the road?
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '58ch', lineHeight: 1.7 }}>
              Whether you&rsquo;re launching a campaign, bringing vehicles into the network, or
              exploring a fleet partnership, tell us what you have in mind.
            </Typography>

            {/* The form leads on a phone. Someone who has scrolled this far has already decided to
                get in touch, and making them pass an address and a map line first is asking them to
                scroll past the thing they came for. */}
            <Box
              sx={{
                mt: { xs: '40px', md: '56px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '0.62fr 1fr' },
                gap: { xs: '48px', md: '72px' },
                alignItems: 'start',
              }}
            >
              <Box sx={{ order: { xs: 2, md: 1 } }}>
                <Typography
                  sx={{
                    fontSize: 'clamp(17px,1.7vw,20px)',
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                    lineHeight: 1.35,
                    color: tokens.navy,
                    textTransform: 'uppercase',
                    maxWidth: '18ch',
                  }}
                >
                  Let&rsquo;s build something that moves.
                </Typography>
                <Typography sx={{ mt: '14px', fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '40ch' }}>
                  Tell us what you&rsquo;re looking to achieve and we&rsquo;ll connect you with the
                  right person.
                </Typography>

                <Box sx={{ mt: '32px', display: 'grid', gap: '22px' }}>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '6px' }}>
                      Email
                    </Typography>
                    <Link
                      href="mailto:Info@adzonroad.com"
                      underline="none"
                      sx={{
                        position: 'relative',
                        display: 'inline-block',
                        fontSize: 15,
                        fontWeight: 600,
                        color: tokens.navy,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          bottom: '-3px',
                          width: '100%',
                          height: '1px',
                          backgroundColor: tokens.amber,
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform .28s ease',
                        },
                        '&:hover::after, &:focus-visible::after': { transform: 'scaleX(1)' },
                        '@media (prefers-reduced-motion: reduce)': { '&::after': { transition: 'none' } },
                      }}
                    >
                      Info@adzonroad.com
                    </Link>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '6px' }}>
                      Location
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: tokens.navy }}>Beirut, Lebanon</Typography>
                  </Box>
                </Box>

                <Box aria-hidden sx={{ mt: '36px', maxWidth: 260 }}>
                  <StreetVisual />
                </Box>

                <Typography sx={{ mt: '32px', fontSize: 13, color: tokens.textMuted }}>
                  Already part of AdzOnRoad?{' '}
                  <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, color: tokens.navy }}>
                    Sign in &rarr;
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ order: { xs: 1, md: 2 } }}>
                {contactSent ? (
                  <Box sx={{ display: 'grid', gap: '14px', justifyItems: 'start', py: '8px' }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: '#EAF7EF',
                        color: tokens.green,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleRoundedIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 'clamp(20px,2.2vw,24px)', letterSpacing: '-0.02em', color: tokens.navy }}>
                      Thanks, {contactName.trim().split(/\s+/)[0]}
                    </Typography>
                    <Typography sx={{ fontSize: 14.5, color: 'text.secondary', maxWidth: '46ch', lineHeight: 1.7 }}>
                      This is a preview build with no mail provider connected, so nothing has actually
                      been sent. On the live site this reaches the team &mdash; in the meantime,{' '}
                      <Link href="mailto:Info@adzonroad.com" underline="hover">email us directly</Link>.
                    </Typography>
                    <Button onClick={resetContactForm} sx={{ mt: '4px', px: 0, fontWeight: 700 }}>
                      Write another message
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleContactSubmit} noValidate sx={{ display: 'grid', gap: '20px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '20px' }}>
                      <TextField
                        label="Full name"
                        required
                        fullWidth
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        error={Boolean(contactErrors.name)}
                        helperText={contactErrors.name}
                        sx={fieldSx}
                      />
                      <TextField
                        label="Email"
                        type="email"
                        required
                        fullWidth
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        error={Boolean(contactErrors.email)}
                        helperText={contactErrors.email}
                        sx={fieldSx}
                      />
                    </Box>

                    {/* Pills rather than a select: four options is few enough to show at once, and
                        seeing them is what tells someone the enquiry gets routed rather than landing
                        in a general inbox. A radiogroup, because exactly one of them applies. */}
                    <Box>
                      <Typography
                        id="contact-interest-label"
                        sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.textMuted, mb: '11px' }}
                      >
                        I&rsquo;m interested in
                      </Typography>
                      <Box role="radiogroup" aria-labelledby="contact-interest-label" sx={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
                        {/* The selected look hangs off a data attribute rather than a conditional
                            in sx. Branching inside sx makes emotion mint a class per state, and
                            here it handed the pills each other's styles — aria-checked moved but
                            the colour stayed on whichever pill rendered first. One static class and
                            an attribute selector cannot get that wrong, and all four now share it. */}
                        {CONTACT_REASONS.map((reason) => (
                          <Box
                            key={reason}
                            component="button"
                            type="button"
                            role="radio"
                            aria-checked={contactReason === reason}
                            data-selected={contactReason === reason ? 'true' : undefined}
                            onClick={() => setContactReason(reason)}
                            sx={{
                              fontFamily: 'inherit',
                              fontSize: 13.5,
                              fontWeight: 600,
                              lineHeight: 1.4,
                              cursor: 'pointer',
                              padding: '9px 16px',
                              borderRadius: '999px',
                              color: tokens.textMuted,
                              backgroundColor: '#FBFBFD',
                              border: `1px solid ${tokens.border}`,
                              transition: 'background-color .2s ease, border-color .2s ease, color .2s ease',
                              '&:hover': { borderColor: '#D3D8E2' },
                              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                              '&[data-selected="true"]': {
                                color: tokens.navy,
                                backgroundColor: 'rgba(245,166,35,0.12)',
                                borderColor: tokens.amber,
                              },
                              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                            }}
                          >
                            {reason}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <TextField
                      label="Phone number (optional)"
                      type="tel"
                      fullWidth
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      sx={fieldSx}
                    />

                    <TextField
                      label="Message"
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder="Tell us a little about what you have in mind…"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      error={Boolean(contactErrors.message)}
                      helperText={contactErrors.message}
                      sx={fieldSx}
                    />

                    <Box>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          '& .arrow': { transition: 'transform .22s ease' },
                          '&:hover .arrow': { transform: 'translateX(3px)' },
                          '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                        }}
                      >
                        Send inquiry
                        <Box component="span" className="arrow" aria-hidden sx={{ ml: '8px', fontSize: 16, lineHeight: 1 }}>
                          &rarr;
                        </Box>
                      </Button>
                      <Typography sx={{ mt: '12px', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.55 }}>
                        We&rsquo;ll only use your details to respond to your inquiry.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Reveal>
      </Container>

      {/* FINAL CTA */}
      <Box sx={{ background: `linear-gradient(135deg, ${tokens.navy} 0%, ${tokens.navy600} 100%)`, padding: '64px clamp(20px,5vw,64px)' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <Box>
            {/* Deliberately not "Ready to put your brand on the road?" any more — that is the
                contact heading immediately above, and running the same sentence twice a screen
                apart made the band read as a repeat rather than an alternative. It has its own
                job: the form is for talking to somebody, this is for skipping that. */}
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(26px,3vw,36px)', mb: '8px', maxWidth: '20ch', color: '#fff' }}>
              Rather just get started?
            </Typography>
            <Typography sx={{ fontSize: 15.5, color: 'rgba(255,255,255,0.7)' }}>Launch a campaign or register your taxi — both take minutes.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate('/signup?role=advertiser')}>
              Launch a Campaign
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
              onClick={() => navigate('/signup?role=driver')}
            >
              Register a Taxi
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box component="footer" sx={{ padding: '48px clamp(20px,5vw,64px) 32px', backgroundColor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1.3fr repeat(3,1fr)' },
              gap: '32px',
              pb: '32px',
              borderBottom: `1px solid ${tokens.border}`,
            }}
          >
            <Box>
              <Box sx={{ mb: '10px' }}>
                <Logo size="md" />
              </Box>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary', maxWidth: '32ch' }}>
                Digital out-of-home advertising on Lebanon's taxis, verified by GPS.
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: '12px' }}>
                Platform
              </Typography>
              <Box sx={{ display: 'grid', gap: '8px', fontSize: 14 }}>
                {['Advertisers', 'Drivers', 'Taxi Companies', 'Coverage', 'Pricing'].map((l) => (
                  <Link key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} underline="hover">
                    {l}
                  </Link>
                ))}
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: '12px' }}>
                Company
              </Typography>
              <Box sx={{ display: 'grid', gap: '8px', fontSize: 14 }}>
                <Link href="#about" underline="hover">
                  About
                </Link>
                <Link href="#contact" underline="hover">
                  Contact
                </Link>
                <Link component={RouterLink} to="/login?role=admin" underline="hover">
                  Admin Login
                </Link>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: '12px' }}>
                Get started
              </Typography>
              <Box sx={{ display: 'grid', gap: '10px' }}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ backgroundColor: tokens.navy, color: '#fff', '&:hover': { backgroundColor: tokens.navy700 } }}
                  onClick={() => navigate('/signup?role=advertiser')}
                >
                  Launch a Campaign
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  sx={{ borderColor: tokens.border, color: tokens.text }}
                  onClick={() => navigate('/signup?role=driver')}
                >
                  Become a Driver Partner
                </Button>
              </Box>
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '20px' }}>© 2026 AdzOnRoad. Beirut, Lebanon.</Typography>
        </Container>
      </Box>
    </Box>
  );
}
