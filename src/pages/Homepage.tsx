import { useMemo, useRef, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Link from '@mui/material/Link';
import GpsFixedRoundedIcon from '@mui/icons-material/GpsFixedRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import Fleet from '@mui/icons-material/LocalShipping';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Logo from '../components/Logo';
import LebanonMap from '../components/LebanonMap';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import { useToast } from '../contexts/ToastProvider';
import { calculateDriverEarnings } from '../services/earningsService';
import { PRICING_TIERS as CAMPAIGN_PRICING_TIERS } from '../services/pricingService';
import { formatCurrency } from '../utils/format';
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

const REGIONS = [
  { name: 'Beirut', screens: 15, status: 'active' },
  { name: 'Mount Lebanon', screens: 7, status: 'active' },
  { name: 'Jounieh', screens: 5, status: 'active' },
  { name: 'Tripoli', screens: 5, status: 'active' },
  { name: 'Byblos', screens: 3, status: 'active' },
  { name: 'Saida', screens: 3, status: 'active' },
];

const BENEFITS = [
  { title: 'GPS-verified advertising', body: 'Every impression is backed by a verified location and timestamp.', icon: GpsFixedRoundedIcon },
  { title: 'Real-time campaign tracking', body: 'Watch display hours, routes and reach as they happen.', icon: InsightsRoundedIcon },
  { title: 'Flexible regional targeting', body: 'Cities, radii, or high-traffic corridors — your choice.', icon: PlaceRoundedIcon },
  { title: 'Transparent pricing', body: 'Clear rates by region, duration and taxi count.', icon: PaidRoundedIcon },
  { title: 'Measurable display hours', body: 'Every hour on-screen is logged and reportable.', icon: ScheduleRoundedIcon },
  { title: 'Additional income for drivers', body: 'Steady earnings layered on top of regular fares.', icon: TrendingUpRoundedIcon },
  { title: 'Wide coverage across Lebanon', body: 'From Tripoli to Tyre, on the roads people already use.', icon: MapRoundedIcon },
  { title: 'Fast campaign launch', body: 'Most campaigns go live within 48 hours of approval.', icon: RocketLaunchRoundedIcon },
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

const PRICING_TIERS = [
  {
    name: '5 Taxis',
    price: formatCurrency(CAMPAIGN_PRICING_TIERS[0].price),
    period: '',
    description: '1 unit, repeating all day',
    features: ['5 taxis', '1 of 6 ad units (15 sec)', 'Repeats every ~90 sec, 8 hrs/day', 'Standard reporting'],
    highlighted: false,
  },
  {
    name: '10 Taxis',
    price: formatCurrency(CAMPAIGN_PRICING_TIERS[1].price),
    period: '',
    description: '1 unit, repeating all day',
    features: ['10 taxis', '1 of 6 ad units (15 sec)', 'Repeats every ~90 sec, 8 hrs/day', 'Standard reporting'],
    highlighted: false,
  },
  {
    name: 'Custom',
    price: 'Custom',
    period: '',
    description: 'Tailored to your campaign.',
    features: ['Custom taxi count', 'Custom number of units', 'Custom display hours', 'Dedicated account manager'],
    highlighted: false,
  },
];

const ABOUT_STATS = [
  { value: '2026', label: 'Founded' },
  { value: '6', label: 'Regions' },
  { value: '142', label: 'Advertisers' },
  { value: '2,610', label: 'Drivers' },
];

const ABOUT_PILLARS = [
  {
    title: 'Verified, not estimated',
    body: 'Every play is matched to a GPS fix and a timestamp before it counts. If we cannot prove an ad ran, it does not appear on the report.',
    icon: VerifiedRoundedIcon,
  },
  {
    title: 'Built for these roads',
    body: 'Regions, traffic corridors and shift patterns that make sense in Lebanon — not a template lifted from a market that works nothing like this one.',
    icon: PublicRoundedIcon,
  },
  {
    title: 'Drivers paid, not used',
    body: 'Screens are installed and insured at no cost, and the earnings sit on top of the fares a driver was already taking.',
    icon: GroupsRoundedIcon,
  },
];

const ABOUT_COMMITMENTS = [
  'Every screen reports its own position',
  'Drivers keep 100% of their fare income',
  'No long-term lock-in for advertisers',
];

const CONTACT_CHANNELS = [
  { label: 'Email', value: 'Info@adzonroad.com', href: 'mailto:Info@adzonroad.com', icon: EmailRoundedIcon },
  { label: 'Phone', value: '+961 71 600 011', href: 'tel:+96171600011', icon: PhoneRoundedIcon },
  { label: 'Office', value: 'Beirut, Lebanon', href: null, icon: PlaceOutlinedIcon },
  { label: 'Hours', value: 'Mon–Fri, 9:00–18:00', href: null, icon: AccessTimeRoundedIcon },
];

/** Routing the enquiry at the form rather than in somebody's inbox. */
const CONTACT_REASONS = [
  'I want to run a campaign',
  'I drive a taxi and want a screen',
  'I run a fleet and want to partner',
  'Press or something else',
];

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

function SectionEyebrow({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.blue, mb: '10px' }}>
      {children}
    </Typography>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [navOpen, setNavOpen] = useState(false);
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(24);
  const [drivesPremiumAreas, setDrivesPremiumAreas] = useState(true);
  const [contactName, setContactName] = useState('');
  const contactNameRef = useRef<HTMLInputElement>(null);

  /**
   * Takes "Talk to our team" to the form and puts the cursor in it.
   *
   * preventScroll on the focus call because focusing would otherwise jump the field to the top of
   * the viewport and undo the smooth scroll that just ran — the two fight, and the abrupt one wins.
   */
  const focusContactForm = () => {
    const field = contactNameRef.current;
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
  };

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
    setContactSent(true);
    showToast('Thanks — your message is ready to send (preview only)');
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

        {/* COVERAGE MAP */}
        <Reveal>
          <Box component="section" id="coverage" sx={{ py: '64px' }}>
            <SectionEyebrow>Live network</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '10px', letterSpacing: '-0.01em' }}>Coverage across Lebanon</Typography>
            <Typography sx={{ fontSize: 15.5, color: 'text.secondary', maxWidth: '60ch', mb: '28px' }}>
              Live taxi and screen positions, campaign zones, and regional availability, updated in real time.
            </Typography>
            <Card sx={{ p: 0, overflow: 'hidden', height: { xs: 320, md: 440 }, position: 'relative', mb: '28px' }}>
              <LebanonMap />
            </Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                Regional breakdown
              </Typography>
              <Chip
                label="Beirut & Mount Lebanon — high demand"
                sx={{ width: 'fit-content', backgroundColor: '#EAF7EF', color: '#0F7A3D', fontWeight: 600, fontSize: 12 }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3,1fr)' }, gap: '18px' }}>
              {REGIONS.map((region) => (
                <Card
                  key={region.name}
                  sx={{
                    p: '24px',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    cursor: 'default',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: tokens.shadowMd },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '14px' }}>
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: region.status === 'active' ? tokens.green : tokens.warn,
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }} noWrap>
                      {region.name}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 28, fontWeight: 800, color: tokens.navy, letterSpacing: '-0.01em' }}>
                    <CountUp value={region.screens} />
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mt: '2px' }}>
                    Screens
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        </Reveal>

        {/* PRICING */}
        <Reveal>
          <Box component="section" id="pricing" sx={{ py: '64px', scrollMarginTop: '20px' }}>
            <SectionEyebrow>Pricing</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '10px', letterSpacing: '-0.01em' }}>Simple, transparent rates</Typography>
            <Typography sx={{ fontSize: 15.5, color: 'text.secondary', maxWidth: '60ch', mb: '10px' }}>
              Choose a plan based on region coverage and taxi count. No hidden fees.
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', maxWidth: '60ch', mb: '28px' }}>
              Each screen rotates up to <strong>6 ad units</strong> of 15 seconds each (a 90-second full cycle), repeating
              continuously across an 8-hour display day — not one continuous 8-hour slot. Buy as many units as you need.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: '20px' }}>
              {PRICING_TIERS.map((tier) => (
                <Card
                  key={`${tier.name}-${tier.price}`}
                  sx={{
                    p: '28px',
                    position: 'relative',
                    border: tier.highlighted ? `2px solid ${tokens.amber}` : `1px solid ${tokens.border}`,
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: tokens.shadowMd },
                  }}
                >
                  {tier.highlighted && (
                    <Chip
                      label="Most popular"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 24,
                        backgroundColor: tokens.amber,
                        color: tokens.navy,
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    />
                  )}
                  <Typography sx={{ fontWeight: 700, fontSize: 18, color: tokens.navy }}>{tier.name}</Typography>
                  <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: '4px', mb: '18px' }}>{tier.description}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px', mb: '20px' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 36, letterSpacing: '-0.01em' }}>{tier.price}</Typography>
                    <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{tier.period}</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gap: '10px', mb: '24px' }}>
                    {tier.features.map((feature) => (
                      <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 14 }}>
                        <CheckRoundedIcon sx={{ fontSize: 18, color: tokens.green }} />
                        {feature}
                      </Box>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant={tier.highlighted ? 'contained' : 'outlined'}
                    color={tier.highlighted ? 'primary' : 'inherit'}
                    sx={!tier.highlighted ? { borderColor: tokens.border, color: tokens.text } : undefined}
                    onClick={() =>
                      tier.name === 'Custom'
                        ? document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                        : navigate('/signup?role=advertiser')
                    }
                  >
                    {tier.name === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </Card>
              ))}
            </Box>
          </Box>
        </Reveal>

        {/* WHY ADZONROAD */}
        <Reveal>
          <Box component="section" sx={{ py: '64px' }}>
            <SectionEyebrow>Why AdzOnRoad</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '28px', letterSpacing: '-0.01em' }}>Built for measurable results</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '16px' }}>
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <Card
                    key={b.title}
                    sx={{
                      p: '22px',
                      border: '1px solid transparent',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: tokens.shadowMd,
                        borderColor: 'rgba(245,166,35,0.4)',
                        '& .benefit-icon': { backgroundColor: tokens.amber, color: '#fff' },
                      },
                    }}
                  >
                    <Box
                      className="benefit-icon"
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#EAF0FF',
                        color: tokens.blue,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: '14px',
                        transition: 'background-color 0.25s ease, color 0.25s ease',
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
          </Box>
        </Reveal>

        {/* DRIVER EARNINGS CALCULATOR */}
        <Reveal>
        <Box component="section" sx={{ py: '64px' }}>
          <SectionEyebrow>Driver earnings</SectionEyebrow>
          <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,30px)', mb: '28px', letterSpacing: '-0.01em' }}>Estimate what you could earn</Typography>
          <Card sx={{ p: { xs: '20px', sm: '32px' } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: '36px', alignItems: 'center' }}>
              <Box sx={{ display: 'grid', gap: '22px' }}>
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Driving hours per day — {hours} hrs</Typography>
                  <Slider value={hours} min={2} max={14} onChange={(_, v) => setHours(v as number)} sx={{ mt: '8px' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Days per month — {days} days</Typography>
                  <Slider value={days} min={10} max={30} onChange={(_, v) => setDays(v as number)} sx={{ mt: '8px' }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Drives in premium areas</Typography>
                    <Switch checked={drivesPremiumAreas} onChange={(e) => setDrivesPremiumAreas(e.target.checked)} />
                  </Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px' }}>
                    Verdun, Gemmayzeh, Saifi, Downtown, etc. — flat $20/month bonus
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ borderLeft: { md: `1px solid ${tokens.border}` }, pl: { md: '32px' } }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Estimated monthly earnings
                </Typography>
                <Typography sx={{ mt: '6px', mb: '18px', fontWeight: 800, fontSize: 'clamp(34px,8vw,44px)', color: tokens.navy }}>${total}</Typography>
                <Box sx={{ display: 'grid', gap: '8px', fontSize: 14 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.textMuted }}>Base pay</span>
                    <span style={{ fontWeight: 600 }}>${base}</span>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.textMuted }}>Driving hours ({hours * days} hrs × $0.60)</span>
                    <span style={{ fontWeight: 600 }}>${hourlyEarnings}</span>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.textMuted }}>Premium areas bonus</span>
                    <span style={{ fontWeight: 600 }}>${premiumBonus}</span>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
        </Reveal>

        {/* ABOUT */}
        <Reveal>
          <Box component="section" id="about" sx={{ py: '64px', scrollMarginTop: '20px' }}>
            <SectionEyebrow>About us</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(24px,5.2vw,32px)', mb: '20px', letterSpacing: '-0.015em', maxWidth: '18ch' }}>
              Built in Beirut, for Lebanon&rsquo;s roads
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' }, gap: { xs: '32px', md: '48px' }, alignItems: 'start' }}>
              <Box>
                <Typography sx={{ fontSize: 'clamp(16px,2vw,18px)', color: tokens.text, lineHeight: 1.65, mb: '16px', fontWeight: 500 }}>
                  Lebanon&rsquo;s roads are full of taxis, and every one of them is the most-seen
                  surface in the country that nobody could measure.
                </Typography>
                <Typography sx={{ fontSize: 15.5, color: 'text.secondary', lineHeight: 1.75, mb: '10px' }}>
                  Outdoor advertising here has always been sold on a photograph and a promise. You paid
                  for a location, and what came back was an estimate somebody made up. We started
                  AdzOnRoad to close that gap: rooftop screens that report where they were, when they
                  played and for how long &mdash; so an advertiser gets evidence instead of an assurance.
                </Typography>
                <Typography sx={{ fontSize: 15.5, color: 'text.secondary', lineHeight: 1.75 }}>
                  The other half of it is the drivers. They were already covering the ground; they just
                  were not being paid for it. Now the same trip earns twice.
                </Typography>

                <Box sx={{ display: 'grid', gap: '2px', mt: '32px' }}>
                  {ABOUT_PILLARS.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <Box
                        key={pillar.title}
                        sx={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'flex-start',
                          py: '18px',
                          borderTop: `1px solid ${tokens.border}`,
                          '&:last-of-type': { borderBottom: `1px solid ${tokens.border}` },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '11px',
                            flexShrink: 0,
                            backgroundColor: '#EAF0FF',
                            color: tokens.blue,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon sx={{ fontSize: 21 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15.5, color: tokens.navy, mb: '4px' }}>
                            {pillar.title}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
                            {pillar.body}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* The panel and the photograph travel together. This column ran 293px shorter
                  than the story beside it, and making the panel alone sticky pinned that gap
                  open while the text scrolled past it. */}
              <Box sx={{ position: { md: 'sticky' }, top: { md: '24px' }, display: 'grid', gap: '16px' }}>
                {/* The stats carry more weight as a dark panel than as the flat four-across strip
                    this replaced: beside the story it reads as a fact sheet rather than a fifth row. */}
                <Card
                  sx={{
                    p: { xs: '24px', sm: '28px' },
                    border: 'none',
                    background: `linear-gradient(160deg, ${tokens.navy} 0%, ${tokens.navy600} 100%)`,
                  }}
                >
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '18px' }}>
                    Where we are today
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 16px' }}>
                    {ABOUT_STATS.map((stat) => (
                      <Box key={stat.label}>
                        <Typography sx={{ fontSize: 'clamp(26px,4vw,30px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                          {stat.value}
                        </Typography>
                        <Typography sx={{ mt: '4px', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: '22px', borderColor: 'rgba(255,255,255,0.14)' }} />

                  <Box sx={{ display: 'grid', gap: '10px' }}>
                    {ABOUT_COMMITMENTS.map((line) => (
                      <Box key={line} sx={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tokens.amber, mt: '2px', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                          {line}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>

                {/* The site's only photograph, and the hero buries it under a navy gradient at
                    94% opacity — so this is the first place it is actually legible. The Beirut
                    sign in the frame is why it belongs under this heading rather than elsewhere. */}
                <Box
                  component="img"
                  src={heroTaxi}
                  alt="An AdzOnRoad screen mounted on a taxi roof in Beirut at night, lit above wet streets"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: { xs: 190, md: 250 },
                    objectFit: 'cover',
                    objectPosition: 'center 32%',
                    borderRadius: '14px',
                    display: 'block',
                  }}
                />
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
            {/* Reads as the next step after the three cards rather than a new topic: whichever
                one someone recognised themselves in, this is where it goes. */}
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              Ready to move?
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(26px,4.4vw,40px)', mb: '14px', letterSpacing: '-0.025em', lineHeight: 1.15, color: tokens.navy, maxWidth: '20ch' }}
            >
              Let&rsquo;s put your next idea on the road.
            </Typography>
            <Typography sx={{ fontSize: 15.5, color: 'text.secondary', maxWidth: '62ch', lineHeight: 1.7 }}>
              Whether you&rsquo;re planning a campaign, bringing vehicles into the network, or
              exploring a fleet partnership, talk directly to the team that handles it.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', mt: '24px', mb: '36px' }}>
              {/* The form is directly below, so this moves to it and puts the cursor in the first
                  field — a button that only scrolls would be asking for a second click. */}
              <Button variant="contained" color="primary" size="large" onClick={focusContactForm}>
                Talk to our team
              </Button>
              <Link
                href="mailto:Info@adzonroad.com"
                underline="hover"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 14.5, fontWeight: 600, color: tokens.navy }}
              >
                <EmailRoundedIcon sx={{ fontSize: 17, color: tokens.amber }} />
                Info@adzonroad.com
              </Link>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' }, gap: '20px', alignItems: 'stretch' }}>
              {/* Details as a dark panel: the form is the busy half, and giving the contact
                  details their own weight stops them reading as a caption to it. */}
              <Card
                sx={{
                  p: { xs: '24px', sm: '30px' },
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(160deg, ${tokens.navy} 0%, ${tokens.navy600} 100%)`,
                }}
              >
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '20px' }}>
                  Reach us directly
                </Typography>

                <Box sx={{ display: 'grid', gap: '18px' }}>
                  {CONTACT_CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const value = (
                      <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>
                        {channel.value}
                      </Typography>
                    );

                    return (
                      <Box key={channel.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '11px',
                            flexShrink: 0,
                            backgroundColor: 'rgba(255,255,255,0.09)',
                            color: tokens.amber,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon sx={{ fontSize: 19 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', mb: '3px' }}>
                            {channel.label}
                          </Typography>
                          {channel.href ? (
                            <Link href={channel.href} underline="hover" sx={{ color: '#fff' }}>
                              {value}
                            </Link>
                          ) : value}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: '24px', borderColor: 'rgba(255,255,255,0.14)' }} />

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '9px', mb: '20px' }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tokens.amber, mt: '2px', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                    We reply to every enquiry within one business day.
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', mb: '10px' }}>
                    Already with us?
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'rgba(255,255,255,0.65)' } }}
                  >
                    Sign in to your account
                  </Button>
                </Box>
              </Card>

              <Card sx={{ p: { xs: '24px', sm: '30px' }, display: 'flex', flexDirection: 'column' }}>
                {contactSent ? (
                  <Box sx={{ display: 'grid', gap: '14px', justifyItems: 'center', textAlign: 'center', my: 'auto', py: '24px' }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: '#EAF7EF',
                        color: tokens.green,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleRoundedIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: tokens.navy }}>
                      Thanks, {contactName.trim().split(/\s+/)[0]}
                    </Typography>
                    <Typography sx={{ fontSize: 14.5, color: 'text.secondary', maxWidth: '42ch', lineHeight: 1.6 }}>
                      This is a preview build with no mail provider connected, so nothing has actually
                      been sent. On the live site this reaches the team and you would hear back within
                      one business day &mdash; in the meantime,{' '}
                      <Link href="mailto:Info@adzonroad.com" underline="hover">email us directly</Link>.
                    </Typography>
                    <Button onClick={resetContactForm} sx={{ mt: '4px', fontWeight: 700 }}>
                      Write another message
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleContactSubmit} noValidate sx={{ display: 'grid', gap: '18px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '18px' }}>
                      <TextField
                        label="Full name"
                        required
                        fullWidth
                        inputRef={contactNameRef}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        error={Boolean(contactErrors.name)}
                        helperText={contactErrors.name}
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
                      />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '18px' }}>
                      <TextField
                        select
                        label="I'm reaching out because"
                        fullWidth
                        value={contactReason}
                        onChange={(e) => setContactReason(e.target.value)}
                      >
                        {CONTACT_REASONS.map((reason) => (
                          <MenuItem key={reason} value={reason} sx={{ whiteSpace: 'normal' }}>
                            {reason}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Phone (optional)"
                        type="tel"
                        fullWidth
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </Box>

                    <TextField
                      label="Message"
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder="Tell us a little about what you have in mind — regions, timing, fleet size, whatever is relevant."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      error={Boolean(contactErrors.message)}
                      helperText={contactErrors.message}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<SendRoundedIcon sx={{ fontSize: 18 }} />}
                      >
                        Send message
                      </Button>
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', flex: '1 1 220px', lineHeight: 1.5 }}>
                        We use your details to reply to this enquiry and nothing else.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Card>
            </Box>
          </Box>
        </Reveal>
      </Container>

      {/* FINAL CTA */}
      <Box sx={{ background: `linear-gradient(135deg, ${tokens.navy} 0%, ${tokens.navy600} 100%)`, padding: '64px clamp(20px,5vw,64px)' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 'clamp(26px,3vw,36px)', mb: '8px', maxWidth: '20ch', color: '#fff' }}>
              Ready to put your brand on the road?
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
