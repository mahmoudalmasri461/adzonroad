import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Link from '@mui/material/Link';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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
import heroTaxiDaylight from '../assets/hero/hero-taxi-daylight.jpg';

/**
 * Five links, not seven. About and Contact moved to the footer, which already listed them, and
 * "Taxi Companies" became "Fleet Partners" — AdzOnRoad may end up working with transport and
 * commercial fleets, not only taxi companies.
 *
 * The href is explicit rather than derived from the label: the section is still id="taxi-companies"
 * and renaming a nav label should not silently break the anchor.
 */
const NAV_LINKS = [
  { label: 'Advertisers', href: '#advertisers' },
  { label: 'Drivers', href: '#drivers' },
  { label: 'Fleet Partners', href: '#taxi-companies' },
  { label: 'Coverage', href: '#coverage' },
  { label: 'Pricing', href: '#pricing' },
];

/**
 * What replaced the hero statistics.
 *
 * The bar said 1,248 active screens, 42.6K ads shown today, 6 regions covered, 3,180 verified
 * hours. None of it came from anywhere — the production database holds no screens at all — and the
 * map that half-corroborated the first figure carried its own invented counts. Three things the
 * product does, stated without a number attached to any of them.
 *
 * "Ad play" rather than "impression": a screen showing an advertisement is not evidence a person
 * saw it, and the platform measures the former.
 */
const HERO_PROOF = [
  { label: 'GPS-linked delivery', body: 'Know where campaign activity occurred.' },
  { label: '15-second ad plays', body: 'Buy measurable campaign delivery.' },
  { label: 'Flexible coverage', body: 'Choose where your campaign runs.' },
];

/**
 * The two halves of the network, and the steps each side takes to join it.
 *
 * Three claims did not survive the rewrite. "GPS-verified impressions" names a unit the platform
 * no longer sells — campaigns are bought as ad plays against a delivery target. "Free rooftop
 * install, fully insured" asserted a cost policy and an insurance position as settled fact, the
 * same claim removed from the taxi-company section; the step now says what AdzOnRoad does rather
 * than what it charges for it. "Paid for coverage, uptime and verified hours" implied payment
 * follows from a screen existing, when earning depends on eligible active driving.
 */
const JOURNEYS = [
  {
    id: 'advertisers',
    label: 'For advertisers',
    accent: tokens.blue,
    steps: [
      { number: '01', title: 'Build your campaign', body: 'Choose your ad-play target, campaign period and creative.' },
      { number: '02', title: 'Choose your coverage', body: 'Select your target regions and vehicle network.' },
      { number: '03', title: 'Launch & follow delivery', body: 'Track campaign progress as your purchased ad plays are delivered.' },
    ],
  },
  {
    id: 'drivers',
    label: 'For drivers',
    accent: tokens.amber600,
    steps: [
      { number: '01', title: 'Join the network', body: 'Register yourself and your eligible vehicle.' },
      { number: '02', title: 'Get equipped', body: 'AdzOnRoad installs and connects the advertising screen.' },
      { number: '03', title: 'Drive & earn', body: 'Drive normally and earn additional income from eligible active driving.' },
    ],
  },
];

/**
 * The three sides of the network, in the order they matter commercially.
 *
 * Three rather than four: the fourth box used to read "Lebanese Business Partners", which is not
 * an audience with anything to sign up for — it described the others in different words. Every
 * entry here has a real destination, because a card that leads nowhere is the placeholder these
 * replaced.
 */
/**
 * Two routes off this section, not three.
 *
 * Drivers and fleets were separate cards making the same offer to the same visitor in different
 * words — somebody with vehicles either drives one or runs several, and both arrive at the same
 * conversation. The job here is routing, so it takes exactly as many paths as there are
 * destinations.
 */
const AUDIENCES = [
  {
    label: 'Advertisers',
    title: 'Put your brand in motion.',
    body: 'Build campaigns around ad plays, coverage and campaign periods.',
    cta: 'Explore advertising',
    to: '/signup?role=advertiser',
  },
  {
    label: 'Drivers & fleets',
    title: 'Turn everyday movement into opportunity.',
    body: 'Join individually or connect eligible vehicles from your fleet.',
    cta: 'Explore partnerships',
    to: '/signup?role=taxiCompany',
  },
] as const;

/**
 * The fleet proposition, with the two claims nobody has signed off removed.
 *
 * "Every vehicle in your fleet earns" is not true of a vehicle that does not qualify or does not
 * drive, and the eligibility rules are not settled. "Installed and fully insured at no cost"
 * states a hardware policy and an insurance position as fact. Neither is restated in softer words
 * here — the section makes no cost or insurance claim at all, which is the only honest position
 * until those are contractually decided.
 */
const FLEET_PROPOSITION = [
  {
    number: '01',
    title: 'New revenue opportunity',
    body: 'Create additional earning potential from participating vehicles.',
  },
  {
    number: '02',
    title: 'We handle the technology',
    body: 'AdzOnRoad manages screen installation, platform connectivity and advertising operations.',
  },
  {
    number: '03',
    title: 'One fleet view',
    body: 'Monitor participating vehicles, activity and earnings from one place.',
  },
];

/**
 * Vehicles in the fleet-view mock. Illustrative: real fleet data needs a signed-in taxi company,
 * so there is nothing public to read, and the identifiers are deliberately anonymous.
 */
const FLEET_SAMPLE_VEHICLES = [
  { id: 'Vehicle 018', active: true },
  { id: 'Vehicle 024', active: true },
  { id: 'Vehicle 031', active: false },
  { id: 'Vehicle 042', active: true },
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
    title: 'How many ad plays?',
    note: 'Each ad play is one 15-second playback of your creative on a vehicle screen.',
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

export default function Homepage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  // Drives the delivery bar in the Measure panel, so it fills as the section arrives rather than
  // having already finished by the time anyone scrolls to it.
  const [measureRef, measureInView] = useInView<HTMLDivElement>();

  // Draws the two journeys together as the section arrives, rather than on page load where the
  // movement would be over before anyone reached it.
  const [journeyRef, journeyInView] = useInView<HTMLDivElement>(0.2);

  // The nav has no separator until there is content behind it to separate from.
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactArea, setContactArea] = useState('');
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
    setContactCompany('');
    setContactPhone('');
    setContactArea('');
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
      {/* NAV
            Five links instead of seven. About and Contact moved to the footer, which already
            listed them, and "Taxi Companies" became "Fleet Partners" — the anchor still points at
            #taxi-companies, so the section id and the nav label are now allowed to differ, which
            is why the links carry an explicit href rather than deriving one from the label.

            The primary action is orange. It was navy, which made it the same colour as the links
            beside it and left the bar with no obvious action. */}
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backgroundColor: tokens.surface,
          // Nothing separates the bar at rest; the line arrives once there is content behind it.
          borderBottom: `1px solid ${navScrolled ? tokens.border : 'transparent'}`,
          boxShadow: navScrolled ? '0 1px 3px rgba(16,24,40,0.06)' : 'none',
          transition: 'border-color .2s ease, box-shadow .2s ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1280, mx: 'auto', px: 'clamp(20px,5vw,64px)',
            height: { xs: 64, md: 76 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <Logo size="md" />

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '28px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                underline="none"
                sx={{
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: tokens.textMuted,
                  transition: 'color .18s ease',
                  '&:hover': { color: tokens.navy },
                  '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '4px', borderRadius: '4px' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate('/login')}
              underline="none"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                fontFamily: 'inherit',
                fontSize: 14.5,
                fontWeight: 600,
                color: tokens.navy,
                background: 'none',
                border: 0,
                cursor: 'pointer',
                '&:hover': { color: tokens.amber600 },
                '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '4px', borderRadius: '4px' },
              }}
            >
              Sign in
            </Link>
            <Button
              variant="contained"
              color="primary"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                '& .arrow': { transition: 'transform .2s ease' },
                '&:hover .arrow': { transform: 'translateX(3px)' },
                '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
              }}
              onClick={() => navigate('/signup?role=advertiser')}
            >
              Launch a Campaign
            </Button>
            <IconButton
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: tokens.navy }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Box>
        </Container>
      </Box>

      <Drawer anchor="right" open={navOpen} onClose={() => setNavOpen(false)}>
        <Box sx={{ width: 272, p: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '10px' }}>
            <Logo size="md" />
            <IconButton aria-label="Close menu" onClick={() => setNavOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          {/* The drawer keeps About and Contact: there is room here, and they are the two the
              desktop bar dropped for space rather than because they stopped mattering. */}
          {[...NAV_LINKS, { label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              underline="none"
              onClick={() => setNavOpen(false)}
              sx={{
                fontSize: 15,
                fontWeight: 500,
                color: tokens.navy,
                py: '11px',
                px: '8px',
                borderRadius: '8px',
                '&:hover': { backgroundColor: tokens.bg },
              }}
            >
              {link.label}
            </Link>
          ))}
          <Box sx={{ display: 'grid', gap: '10px', mt: '18px' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => { setNavOpen(false); navigate('/signup?role=advertiser'); }}
            >
              Launch a Campaign
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.navy }}
              onClick={() => { setNavOpen(false); navigate('/login'); }}
            >
              Sign in
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* HERO
            The photograph is the hero now, not an illustration sitting beside it. The old layout
            was a text column next to a rounded image card with a floating "72% delivered" panel on
            top of it — the shape every SaaS landing page has, which made a moving-media company
            look like it sold software. The card, its rounded corners and the example figures are
            all gone.

            The image is full-bleed and the type sits inside it. A gradient carries the left side
            for legibility and releases before it reaches the vehicle, so the Beirut daylight and
            the rooftop screen stay as they were photographed rather than being tinted navy.

            No annotation is pinned to the screen. With object-fit: cover the crop shifts with the
            viewport, so anything positioned over the vehicle drifts off it at other window sizes —
            and a label sliding onto the car reads worse than no label at all. */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 620, sm: 660, md: 'clamp(680px, 78vh, 820px)' },
          backgroundColor: tokens.navy,
          '@keyframes adzHeroIn': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& [data-hero-in]': { animation: 'none !important', opacity: 1 },
          },
        }}
      >
        {/* object-position is tuned per breakpoint rather than left at center. The rooftop screen
            sits in the upper middle of the frame, and on a wide window cover crops vertically —
            centering it pushes the screen off the top edge. */}
        <Box
          component="img"
          src={heroTaxiDaylight}
          alt="A black Mercedes on the Beirut corniche carrying an AdzOnRoad digital advertising screen mounted along its roof"
          fetchPriority="high"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: { xs: '62% 50%', sm: '60% 50%', md: 'center 45%' },
            display: 'block',
            zIndex: 0,
          }}
        />

        {/* Left-weighted on desktop so the vehicle keeps its daylight, top-weighted on a phone
            where the type sits above the car rather than beside it. The second layer is a short
            scrim at the very bottom, which is the only thing holding the proof strip up. */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage: {
              xs: `linear-gradient(180deg, rgba(15,27,61,0.90) 0%, rgba(15,27,61,0.74) 38%, rgba(15,27,61,0.34) 66%, rgba(15,27,61,0.62) 100%)`,
              md: `linear-gradient(90deg, rgba(15,27,61,0.88) 0%, rgba(15,27,61,0.74) 28%, rgba(15,27,61,0.42) 46%, rgba(15,27,61,0.10) 66%, rgba(15,27,61,0) 82%),
                   linear-gradient(0deg, rgba(15,27,61,0.58) 0%, rgba(15,27,61,0) 24%)`,
            },
          }}
        />

        <Container
          maxWidth={false}
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 1280,
            mx: 'auto',
            px: 'clamp(20px,5vw,64px)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pt: { xs: '52px', md: '64px' },
            pb: { xs: '28px', md: '40px' },
          }}
        >
          {/* The rooftop screen's enclosure starts at 44.3% of the photograph and the AdzOnRoad
              branding on it at 47.5%, so the type has to stay left of 44% of the rendered width.
              With the container centred at 1280 that caps the headline at about 62px rather than
              the 70 it would otherwise take — the photograph's composition sets the type size
              here, because the vehicle is centred in frame rather than sitting in the right half. */}
          <Box sx={{ maxWidth: { xs: '100%', md: 540 } }}>
            <Typography
              data-hero-in
              sx={{
                fontSize: { xs: 11.5, md: 12.5 },
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: tokens.amber,
                mb: { xs: '14px', md: '18px' },
                animation: 'adzHeroIn .5s ease-out both',
              }}
            >
              Lebanon&rsquo;s moving media network
            </Typography>

            <Typography
              data-hero-in
              component="h1"
              sx={{
                m: 0,
                fontWeight: 800,
                fontSize: 'clamp(44px, 4.9vw, 60px)',
                lineHeight: 0.98,
                letterSpacing: '-0.045em',
                textTransform: 'uppercase',
                color: '#fff',
                textWrap: 'balance',
                textShadow: '0 2px 28px rgba(6,12,30,0.42)',
                animation: 'adzHeroIn .55s ease-out .06s both',
              }}
            >
              Make the city
              <Box component="span" sx={{ display: 'block', color: tokens.amber }}>
                your billboard.
              </Box>
            </Typography>

            <Typography
              data-hero-in
              sx={{
                mt: { xs: '18px', md: '24px' },
                fontSize: { xs: 16, md: 18 },
                lineHeight: 1.62,
                color: 'rgba(255,255,255,0.86)',
                maxWidth: 505,
                textShadow: '0 1px 16px rgba(6,12,30,0.4)',
                animation: 'adzHeroIn .55s ease-out .12s both',
              }}
            >
              Launch location-targeted campaigns across a network of moving digital screens
              &mdash; with measurable delivery and GPS-linked reporting.
            </Typography>

            {/* One button, then a link. Two filled buttons side by side made exploring the network
                as loud as launching a campaign, and only one of those is the conversion. */}
            <Box
              data-hero-in
              sx={{
                mt: { xs: '26px', md: '34px' },
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: { xs: '14px', md: '24px' },
                animation: 'adzHeroIn .55s ease-out .18s both',
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/signup?role=advertiser')}
                sx={{
                  fontSize: { xs: 15, md: 16 },
                  px: { xs: '24px', md: '30px' },
                  py: { md: '13px' },
                  boxShadow: '0 10px 30px rgba(6,12,30,0.34)',
                  '& .arrow': { transition: 'transform .2s ease' },
                  '&:hover .arrow': { transform: 'translateX(3px)' },
                  '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                }}
              >
                Launch a campaign
                <Box component="span" className="arrow" aria-hidden sx={{ ml: '9px', fontSize: 17, lineHeight: 1 }}>
                  &rarr;
                </Box>
              </Button>

              <Link
                href="#coverage"
                underline="none"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  fontSize: 15.5,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.92)',
                  '& .arrow': { transition: 'transform .2s ease' },
                  '&:hover': { color: '#fff' },
                  '&:hover .arrow': { transform: 'translateX(3px)' },
                  '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '4px', borderRadius: '4px' },
                  '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                }}
              >
                Explore the network
                <Box component="span" className="arrow" aria-hidden sx={{ fontSize: 16, lineHeight: 1 }}>
                  &rarr;
                </Box>
              </Link>
            </Box>

            <Typography
              data-hero-in
              sx={{
                mt: { xs: '20px', md: '26px' },
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.62)',
                animation: 'adzHeroIn .55s ease-out .24s both',
              }}
            >
              Drive with AdzOnRoad?{' '}
              <Link
                component={RouterLink}
                to="/signup?role=driver"
                underline="hover"
                sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}
              >
                Become a driver partner &rarr;
              </Link>
            </Typography>
          </Box>
        </Container>

        {/* The proof strip rides inside the bottom of the photograph rather than sitting in a band
            under it, so the image runs to the edge of the section. Rules between items, not cards.
            On a phone the sentences drop and the three labels stay — at that width the full strip
            was four stacked rows of text competing with the headline. */}
        <Container
          maxWidth={false}
          data-hero-in
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 1280,
            mx: 'auto',
            px: 'clamp(20px,5vw,64px)',
            pb: { xs: '26px', md: '34px' },
            animation: 'adzHeroIn .6s ease-out .3s both',
          }}
        >
          <Box
            sx={{
              pt: { xs: '18px', md: '24px' },
              borderTop: '1px solid rgba(255,255,255,0.22)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: { xs: '10px 18px', sm: '20px 44px' },
            }}
          >
            {HERO_PROOF.map((item, i) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  gap: { xs: '18px', sm: '44px' },
                  flex: { sm: '1 1 200px' },
                }}
              >
                {i > 0 && (
                  <Box
                    aria-hidden
                    sx={{
                      width: '1px',
                      alignSelf: 'stretch',
                      minHeight: { xs: 12, sm: 30 },
                      backgroundColor: 'rgba(255,255,255,0.24)',
                    }}
                  />
                )}
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: 10.5, md: 11.5 },
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: tokens.amber,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      mt: '6px',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: 'rgba(255,255,255,0.78)',
                      maxWidth: '28ch',
                    }}
                  >
                    {item.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>


      <Container maxWidth={false} sx={{ maxWidth: 1280, mx: 'auto', px: 'clamp(20px,5vw,64px)' }}>
        {/* HOW IT WORKS
            Two white cards side by side listed two sets of steps and never said the thing that
            makes the model interesting: they are two halves of one network. The journeys converge
            on the platform now, and end on a single shared outcome instead of stopping separately.

            Three claims went in the rewrite. "GPS-verified impressions" describes a unit the
            platform does not sell any more — campaigns are bought as ad plays. "Free rooftop
            install, fully insured" stated a cost policy and an insurance position as settled fact,
            the same claim removed from the taxi-company section. "Paid for coverage, uptime and
            verified hours" implied payment follows from a screen existing, when earning depends on
            eligible active driving. See JOURNEYS for the wording that replaced each. */}
        <Reveal>
          <Box component="section" ref={journeyRef} sx={{ py: { xs: '44px', md: '56px' } }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              How it works
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              Two sides.
              <Box component="span" sx={{ display: 'block' }}>
                One moving network.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '52ch', lineHeight: 1.75 }}>
              Advertisers launch measurable campaigns. Drivers keep the network moving. AdzOnRoad
              connects the two.
            </Typography>

            {/* Grid rather than two columns of cards: on a phone the network sits between the two
                journeys, which is the order the relationship reads in. On desktop the journeys sit
                side by side and the network spans beneath them, which is where they converge. */}
            <Box
              sx={{
                mt: { xs: '28px', md: '32px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: { md: '56px' },
                rowGap: { xs: '36px', md: '0px' },
              }}
            >
              {JOURNEYS.map((journey) => (
                <Box
                  key={journey.id}
                  id={journey.id}
                  sx={{
                    scrollMarginTop: '20px',
                    order: { xs: journey.id === 'advertisers' ? 1 : 3, md: journey.id === 'advertisers' ? 1 : 2 },
                    pl: { md: journey.id === 'drivers' ? '56px' : 0 },
                    ml: { md: journey.id === 'drivers' ? '-56px' : 0 },
                    borderLeft: { md: journey.id === 'drivers' ? `1px solid ${tokens.border}` : 'none' },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: journey.accent, mb: '20px' }}
                  >
                    {journey.label}
                  </Typography>

                  {journey.steps.map((step, i) => (
                    <Box
                      key={step.number}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr',
                        pt: i === 0 ? 0 : '15px',
                        mt: i === 0 ? 0 : '15px',
                        borderTop: i === 0 ? 'none' : `1px solid ${tokens.border}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: journey.accent, letterSpacing: '0.04em', pt: '2px' }}>
                        {step.number}
                      </Typography>
                      <Box>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.navy, mb: '5px' }}
                        >
                          {step.title}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.65, maxWidth: '42ch' }}>
                          {step.body}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}

              <Box
                sx={{
                  order: { xs: 2, md: 3 },
                  gridColumn: { md: '1 / -1' },
                  mt: { md: '48px' },
                }}
              >
                {/* Both journeys arriving at the same place. Desktop only: on a phone the two
                    columns are already stacked, so there is nothing to converge. */}
                <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Box component="svg" viewBox="0 0 800 56" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
                    <path
                      d="M180 2 C 180 34, 400 20, 400 52 M620 2 C 620 34, 400 20, 400 52"
                      stroke={tokens.amber}
                      strokeWidth="1.5"
                      strokeOpacity="0.5"
                      strokeLinecap="round"
                      strokeDasharray="480"
                      strokeDashoffset={journeyInView ? 0 : 480}
                      style={{ transition: 'stroke-dashoffset 1.1s ease-out' }}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: { xs: 0, md: '-2px' },
                    textAlign: 'center',
                    borderTop: { xs: `1px solid ${tokens.border}`, md: 'none' },
                    pt: { xs: '32px', md: 0 },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.navy, mb: '14px' }}
                  >
                    The AdzOnRoad network
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px 14px' }}>
                    {['Campaigns', 'Vehicles', 'Location data', 'Playback evidence'].map((part, i) => (
                      <Box key={part} sx={{ display: 'flex', alignItems: 'center', gap: '10px 14px' }}>
                        {i > 0 && (
                          <Box aria-hidden sx={{ fontSize: 13, color: tokens.amber, fontWeight: 700 }}>
                            +
                          </Box>
                        )}
                        <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}>{part}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* And out the other side. */}
                  <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center', mt: '20px' }}>
                    <Box
                      sx={{
                        width: '1px',
                        height: 28,
                        backgroundColor: tokens.amber,
                        opacity: 0.5,
                        transformOrigin: 'top',
                        transform: journeyInView ? 'scaleY(1)' : 'scaleY(0)',
                        transition: 'transform .6s ease-out .9s',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

          </Box>
        </Reveal>


        {/* FOR TAXI COMPANIES
            Four equal cards made a partnership proposition read like a feature list, and two of
            them made claims nobody has signed off. "Every vehicle in your fleet earns" is not true
            of a vehicle that does not qualify or does not drive; "installed and fully insured at
            no cost" states a hardware policy and an insurance position as settled fact. Both are
            gone, and nothing here replaces them with a softer version of the same promise — the
            section simply does not make a cost or insurance claim. */}
        <Reveal>
          <Box component="section" id="taxi-companies" sx={{ py: { xs: '44px', md: '56px' }, scrollMarginTop: '20px' }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
            >
              For fleet partners
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,4.8vw,44px)', letterSpacing: '-0.028em', lineHeight: 1.12, color: tokens.navy }}
            >
              Your fleet is already moving.
              <Box component="span" sx={{ display: 'block' }}>
                Make it work harder.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '58ch', lineHeight: 1.7 }}>
              Turn eligible vehicles in your fleet into a new advertising revenue channel with
              AdzOnRoad.
            </Typography>

            <Box
              sx={{
                mt: { xs: '28px', md: '32px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '0.82fr 1fr' },
                gap: { xs: '44px', md: '64px' },
                alignItems: 'start',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  sx={{
                    fontSize: 'clamp(20px,2.3vw,26px)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: tokens.navy,
                    textTransform: 'uppercase',
                    maxWidth: '16ch',
                  }}
                >
                  Another revenue channel.
                  <Box component="span" sx={{ display: 'block', color: tokens.amber }}>
                    Same fleet.
                  </Box>
                </Typography>

                <Typography sx={{ mt: '16px', fontSize: 15, color: 'text.secondary', lineHeight: 1.75, maxWidth: '48ch' }}>
                  AdzOnRoad equips eligible vehicles with digital advertising screens and manages the
                  advertising network while your fleet continues doing what it already does &mdash;
                  driving.
                </Typography>

                {/* On a phone the CTA comes before the three points, per the intended stack: a
                    fleet owner who is already convinced should not have to scroll the argument to
                    reach the button. On desktop it reads in the normal order underneath them. */}
                <Box sx={{ mt: '26px', order: { xs: 2, md: 1 } }}>
                  {FLEET_PROPOSITION.map((item, i) => (
                    <Box
                      key={item.number}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr',
                        pt: i === 0 ? 0 : '15px',
                        mt: i === 0 ? 0 : '15px',
                        borderTop: i === 0 ? 'none' : `1px solid ${tokens.border}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: tokens.amber, letterSpacing: '0.04em', pt: '2px' }}>
                        {item.number}
                      </Typography>
                      <Box>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.navy, mb: '5px' }}
                        >
                          {item.title}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.65, maxWidth: '44ch' }}>
                          {item.body}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ order: { xs: 1, md: 2 } }}>
                <Box sx={{ mt: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/signup?role=taxiCompany')}
                    sx={{
                      '& .arrow': { transition: 'transform .22s ease' },
                      '&:hover .arrow': { transform: 'translateX(3px)' },
                      '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                    }}
                  >
                    Partner your fleet
                    <Box component="span" className="arrow" aria-hidden sx={{ ml: '8px', fontSize: 16, lineHeight: 1 }}>
                      &rarr;
                    </Box>
                  </Button>
                  <Link
                    component={RouterLink}
                    to="/#contact"
                    underline="hover"
                    sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}
                  >
                    Talk to our team
                  </Link>
                </Box>

                <Typography sx={{ mt: '16px', fontSize: 13, color: tokens.textMuted, lineHeight: 1.6 }}>
                  Have a large fleet? Contact us for a tailored partnership.
                </Typography>
                </Box>
              </Box>

              {/* A picture of the fleet view a partner would get. Illustrative throughout: fleet
                  data needs a signed-in taxi company, so there is nothing real to read here, and
                  earnings sit at an em dash rather than a number nobody has agreed. Hidden from
                  assistive technology so none of it is announced as this company's fleet. */}
              <Box
                aria-hidden
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  p: { xs: '20px', sm: '26px' },
                }}
              >
                <Typography
                  sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMuted, mb: '16px' }}
                >
                  Example view
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4,1fr)' }, gap: '10px' }}>
                  {FLEET_SAMPLE_VEHICLES.map((v) => (
                    <Box
                      key={v.id}
                      sx={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: '#FBFBFD',
                        border: `1px solid ${tokens.border}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.navy, mb: '6px' }}>{v.id}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: v.active ? tokens.green : tokens.textMuted,
                          }}
                        />
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{v.active ? 'Active' : 'Offline'}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* The vehicles feed one view. A single line rather than boxes and arrows — this is
                    a relationship, not an architecture diagram. */}
                <Box sx={{ display: 'flex', justifyContent: 'center', py: '14px' }}>
                  <Box sx={{ width: '1px', height: 26, backgroundColor: tokens.amber, opacity: 0.5 }} />
                </Box>

                <Box sx={{ p: '18px', borderRadius: '12px', backgroundColor: '#FBFBFD', border: `1px solid ${tokens.border}` }}>
                  <Typography
                    sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted, mb: '14px' }}
                  >
                    Fleet overview
                  </Typography>

                  <Box sx={{ display: 'grid', gap: '11px' }}>
                    {[
                      { label: 'Participating vehicles', value: '24' },
                      { label: 'Active today', value: '18' },
                      { label: 'Verified operating hours', value: '142h' },
                      { label: 'Fleet earnings', value: '$—' },
                    ].map((row) => (
                      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: tokens.navy }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography sx={{ mt: '16px', fontSize: 12.5, fontWeight: 700, color: tokens.amber600 }}>
                    View fleet reporting &rarr;
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Who does what, in the fewest words the partnership can be described in. */}
            <Box
              sx={{
                mt: { xs: '44px', md: '56px' },
                pt: { xs: '30px', md: '36px' },
                borderTop: `1px solid ${tokens.border}`,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: '28px', sm: '48px' },
              }}
            >
              {[
                { label: 'AdzOnRoad handles', items: ['Screen installation', 'Advertising campaigns', 'Technology', 'Reporting'] },
                { label: 'Your fleet provides', items: ['Eligible vehicles', 'Drivers', 'Road coverage'] },
              ].map((col, i) => (
                <Box
                  key={col.label}
                  sx={{
                    pl: { sm: i === 0 ? 0 : '48px' },
                    ml: { sm: i === 0 ? 0 : '-48px' },
                    borderLeft: { sm: i === 0 ? 'none' : `1px solid ${tokens.border}` },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '12px' }}
                  >
                    {col.label}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px' }}>
                    {col.items.map((item) => (
                      <Typography key={item} sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}>
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
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
          <Box component="section" id="coverage" sx={{ py: { xs: '44px', md: '56px' }, scrollMarginTop: '20px' }}>
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
                      {/* Capped: at full width the map ran 859px tall and was the tallest thing
                          on the page by a distance. It is the section's centrepiece, not its
                          entire height. */}
                      <Box sx={{ maxWidth: 384, mx: 'auto' }}>
                        <LebanonMap areas={mapAreas} selected={selectedArea} onSelect={setSelectedArea} />
                      </Box>
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

                    {/* The region navigator, as pills rather than full-width rows. Eight rows at
                        46px each ran the column 300px past the map beside it; the same eight
                        targets wrap into three lines and still carry state, status and focus. The
                        map is the primary selector — this is the keyboard path to the same thing. */}
                    <Box
                      role="radiogroup"
                      aria-label="Coverage area"
                      sx={{ mt: '26px', pt: '20px', borderTop: `1px solid ${tokens.border}`, display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    >
                      {mapAreas.map((area) => {
                        const isSelected = area.name === selectedArea;
                        return (
                          <Box
                            key={area.name}
                            component="button"
                            type="button"
                            role="radio"
                            onClick={() => setSelectedArea(area.name)}
                            aria-checked={isSelected}
                            data-selected={isSelected ? 'true' : undefined}
                            sx={{
                              fontFamily: 'inherit',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 13px',
                              borderRadius: '999px',
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: area.covered ? tokens.navy : tokens.textMuted,
                              backgroundColor: '#FBFBFD',
                              border: `1px solid ${tokens.border}`,
                              transition: 'border-color .18s ease, background-color .18s ease',
                              '&:hover': { borderColor: tokens.navy },
                              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                              '&[data-selected="true"]': {
                                borderColor: tokens.navy,
                                backgroundColor: '#fff',
                                fontWeight: 700,
                              },
                              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                            }}
                          >
                            <Box
                              aria-hidden
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                flexShrink: 0,
                                backgroundColor: !area.covered ? tokens.textMuted : isSelected ? tokens.amber : tokens.navy,
                              }}
                            />
                            {area.name}
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
          <Box
            component="section"
            id="pricing"
            sx={{
              my: { xs: '10px', md: '14px' },
              px: { xs: '20px', sm: '32px', md: '44px' },
              py: { xs: '38px', md: '46px' },
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: { xs: '18px', md: '24px' },
              scrollMarginTop: '20px',
            }}
          >
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
                mt: { xs: '28px', md: '32px' },
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
                <Typography sx={{ mt: '6px', fontSize: 13.5, color: 'text.secondary' }}>15-second ad plays</Typography>

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

              </Box>
            </Box>

            {/* What the money buys, spelled out — the old cards listed inventory, which is not the
                same thing and is what made the model easy to misread. */}
            <Box sx={{ mt: { xs: '36px', md: '44px' }, pt: { xs: '26px', md: '30px' }, borderTop: `1px solid ${tokens.border}` }}>
              <Typography
                sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '18px' }}
              >
                What you&rsquo;re buying
              </Typography>
              {/* One line instead of six ticks across three columns. The list said in a grid what
                  the sentence below it already says better, and it was the last "row of three"
                  on the page. */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '18px' }}>
                {['15-second ad plays', 'Flexible campaign periods', 'Location-linked delivery reporting'].map((item, i) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: '10px 14px' }}>
                    {i > 0 && (
                      <Box aria-hidden sx={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: tokens.amber }} />
                    )}
                    <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}>{item}</Typography>
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
          <Box component="section" sx={{ py: { xs: '44px', md: '56px' } }}>
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
                without standing still.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, color: 'text.secondary', maxWidth: '58ch', lineHeight: 1.7 }}>
              Your campaign moves through the city instead of staying fixed to one location.
            </Typography>

            {/* The comparison the headline makes, shown rather than asserted: the same campaign
                period, one pin against a route of them. No figures on either side — the point is
                the shape of the coverage, and neither number exists to be quoted. Decorative, so
                it is hidden from assistive technology; the captions carry the meaning in text. */}
            <Box
              sx={{
                mt: { xs: '28px', md: '34px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: '20px', sm: '0px' },
              }}
            >
              {[
                {
                  label: 'A fixed billboard',
                  caption: 'One location for the whole campaign period.',
                  muted: true,
                },
                {
                  label: 'An AdzOnRoad screen',
                  caption: 'Many locations across that same period.',
                  muted: false,
                },
              ].map((col, i) => (
                <Box
                  key={col.label}
                  sx={{
                    pl: { sm: i === 0 ? 0 : '32px' },
                    borderLeft: { sm: i === 0 ? 'none' : `1px solid ${tokens.border}` },
                    pt: { xs: i === 0 ? 0 : '20px', sm: 0 },
                    borderTop: { xs: i === 0 ? 'none' : `1px solid ${tokens.border}`, sm: 'none' },
                  }}
                >
                  <Box
                    aria-hidden
                    component="svg"
                    viewBox="0 0 240 46"
                    fill="none"
                    sx={{ width: '100%', maxWidth: 240, height: 'auto', display: 'block', mb: '12px' }}
                  >
                    <path d="M6 38 H234" stroke={tokens.navy} strokeOpacity="0.08" strokeWidth="1.25" strokeLinecap="round" />
                    {col.muted ? (
                      <>
                        <circle cx="120" cy="38" r="11" fill={tokens.textMuted} fillOpacity="0.1" />
                        <circle cx="120" cy="38" r="4" fill={tokens.textMuted} />
                        <rect x="108" y="8" width="24" height="16" rx="3" fill={tokens.textMuted} fillOpacity="0.16" stroke={tokens.textMuted} strokeOpacity="0.4" />
                        <path d="M120 24 V32" stroke={tokens.textMuted} strokeOpacity="0.4" strokeWidth="1.5" />
                      </>
                    ) : (
                      <>
                        <path d="M6 38 H234" stroke={tokens.amber} strokeOpacity="0.5" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="6 9" />
                        {[6, 63, 120, 177].map((cx) => (
                          <circle key={cx} cx={cx} cy="38" r="3.5" fill={tokens.navy} fillOpacity="0.28" />
                        ))}
                        <circle cx="234" cy="38" r="11" fill={tokens.amber} fillOpacity="0.14" />
                        <circle cx="234" cy="38" r="4.5" fill={tokens.amber} />
                        <rect x="222" y="8" width="24" height="16" rx="3" fill={tokens.amber} fillOpacity="0.18" stroke={tokens.amber} strokeOpacity="0.7" />
                        <path d="M234 24 V32" stroke={tokens.amber} strokeOpacity="0.7" strokeWidth="1.5" />
                      </>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: col.muted ? tokens.textMuted : tokens.amber,
                      mb: '5px',
                    }}
                  >
                    {col.label}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6, maxWidth: '34ch' }}>
                    {col.caption}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                mt: { xs: '28px', md: '32px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr 1fr' },
                gap: '16px',
              }}
            >
              {/* VERIFY — still the reason the other two matter, so it leads and takes the wider
                  column. It used to span both rows, which forced the row to the height of two
                  stacked cards and left the route diagram stretching to fill 300px of nothing. */}
              <Box
                sx={{
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
                      { label: 'Recorded ad plays', value: '12,480' },
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
          <Box
            component="section"
            sx={{
              my: { xs: '10px', md: '14px' },
              px: { xs: '20px', sm: '32px', md: '44px' },
              py: { xs: '38px', md: '46px' },
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: { xs: '18px', md: '24px' },
            }}
          >
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
                mt: { xs: '28px', md: '32px' },
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
          <Box component="section" id="about" sx={{ py: { xs: '44px', md: '56px' }, scrollMarginTop: '20px' }}>
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
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={heroTaxi}
                  alt="An AdzOnRoad screen mounted on a taxi roof in Beirut, lit above the street"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: { xs: 300, sm: 380, md: 470 },
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
              py: { xs: '64px', md: '88px' },
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

            A signpost, not a sales section: two routes off the page, because there are two places
            a visitor can go from here. */}
        <Reveal>
          <Box component="section" sx={{ pt: '44px', pb: '60px' }}>
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

            {/* Typography and a rule, not cards. Two destinations do not need containers to be
                told apart, and the feature card this replaced stood 630px tall to say one
                sentence. */}
            <Box
              sx={{
                mt: { xs: '32px', md: '44px' },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: '32px', md: '56px' },
              }}
            >
              {AUDIENCES.map((a, i) => (
                <Box
                  key={a.label}
                  sx={{
                    pl: { md: i === 0 ? 0 : '56px' },
                    ml: { md: i === 0 ? 0 : '-56px' },
                    borderLeft: { md: i === 0 ? 'none' : `1px solid ${tokens.border}` },
                    pt: { xs: i === 0 ? 0 : '32px', md: 0 },
                    borderTop: { xs: i === 0 ? 'none' : `1px solid ${tokens.border}`, md: 'none' },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.amber, mb: '10px' }}
                  >
                    {a.label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 'clamp(20px,2.3vw,26px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.navy, mb: '10px', maxWidth: '18ch' }}
                  >
                    {a.title}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: 'text.secondary', lineHeight: 1.7, maxWidth: '40ch', mb: '18px' }}>
                    {a.body}
                  </Typography>
                  <Link
                    component={RouterLink}
                    to={a.to}
                    underline="none"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: tokens.navy,
                      '& .arrow': { transition: 'transform .22s ease' },
                      '&:hover': { color: tokens.amber600 },
                      '&:hover .arrow': { transform: 'translateX(3px)' },
                      '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '4px', borderRadius: '4px' },
                      '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                    }}
                  >
                    {a.cta}
                    <Box component="span" className="arrow" aria-hidden sx={{ fontSize: 16, lineHeight: 1 }}>
                      &rarr;
                    </Box>
                  </Link>
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>

        {/* CONTACT */}
        <Reveal>
          <Box
            component="section"
            id="contact"
            sx={{
              my: { xs: '10px', md: '14px' },
              px: { xs: '20px', sm: '32px', md: '44px' },
              py: { xs: '38px', md: '46px' },
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: { xs: '18px', md: '24px' },
              scrollMarginTop: '20px',
            }}
          >
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
                mt: { xs: '28px', md: '32px' },
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
                        label="Work email"
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

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
                      <TextField
                        label="Company (optional)"
                        fullWidth
                        value={contactCompany}
                        onChange={(e) => setContactCompany(e.target.value)}
                        sx={fieldSx}
                      />
                      <TextField
                        label="Phone number (optional)"
                        type="tel"
                        fullWidth
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        sx={fieldSx}
                      />
                      {/* The same eight areas the coverage map is built from, so the option list
                          cannot drift from what the network actually covers. */}
                      <TextField
                        select
                        label="Campaign area (optional)"
                        fullWidth
                        value={contactArea}
                        onChange={(e) => setContactArea(e.target.value)}
                        sx={fieldSx}
                      >
                        <MenuItem value="">Not sure yet</MenuItem>
                        {COVERAGE_AREAS.map((area) => (
                          <MenuItem key={area.name} value={area.name}>
                            {area.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

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

      {/* FINAL CTA
            "Rather just get started?" with Launch a Campaign and Register a Taxi side by side gave
            two actions equal weight and asked a slightly awkward question to introduce them. The
            close targets advertisers now — they are the side that pays — with coverage second and
            drivers as a line of text rather than a third button.

            "Register a Taxi" is gone as wording too: somebody signs up as a driver partner, not as
            a vehicle. */}
      <Box component="section" sx={{ backgroundColor: tokens.navy }}>
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1280, mx: 'auto', px: 'clamp(20px,5vw,64px)',
            py: { xs: '44px', md: '44px' },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.45fr 1fr' },
            gap: { xs: '32px', md: '56px' },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.amber, mb: '10px' }}
            >
              Ready to move?
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 'clamp(28px,3.4vw,44px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff' }}
            >
              Put your next campaign
              <Box component="span" sx={{ display: 'block' }}>
                on the road.
              </Box>
            </Typography>
            <Typography sx={{ mt: '16px', fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', maxWidth: '52ch' }}>
              Launch your campaign across AdzOnRoad&rsquo;s moving screen network and track delivery
              as it happens.
            </Typography>

            <Box sx={{ mt: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/signup?role=advertiser')}
                sx={{
                  '& .arrow': { transition: 'transform .2s ease' },
                  '&:hover .arrow': { transform: 'translateX(3px)' },
                  '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                }}
              >
                Launch a campaign
                <Box component="span" className="arrow" aria-hidden sx={{ ml: '8px', fontSize: 16, lineHeight: 1 }}>
                  &rarr;
                </Box>
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="#coverage"
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.32)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.04)' },
                  '& .arrow': { transition: 'transform .2s ease' },
                  '&:hover .arrow': { transform: 'translateX(3px)' },
                  '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                }}
              >
                Explore coverage
                <Box component="span" className="arrow" aria-hidden sx={{ ml: '8px', fontSize: 16, lineHeight: 1 }}>
                  &rarr;
                </Box>
              </Button>
            </Box>

            <Typography sx={{ mt: '18px', fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>
              Want to drive with us?{' '}
              <Link
                component={RouterLink}
                to="/signup?role=driver"
                underline="hover"
                sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}
              >
                Become a driver partner &rarr;
              </Link>
            </Typography>
          </Box>

          {/* A route with campaigns on it. Not a map and not a dashboard — it sits behind the
              message rather than beside it, and drops out on a phone where it would only push the
              buttons down the page. */}
          <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box component="svg" viewBox="0 0 380 210" fill="none" sx={{ width: '100%', height: 'auto', display: 'block' }}>
              <path
                d="M14 186 C 92 178, 118 128, 176 118 S 268 84, 366 34"
                stroke="#fff"
                strokeOpacity="0.1"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M14 186 C 92 178, 118 128, 176 118 S 268 84, 366 34"
                stroke={tokens.amber}
                strokeOpacity="0.55"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeDasharray="7 11"
              />
              {[
                [92, 172],
                [176, 118],
              ].map(([cx, cy]) => (
                <circle key={cx} cx={cx} cy={cy} r="3.5" fill="#fff" fillOpacity="0.35" />
              ))}

              {/* the vehicle, as a screen on the move */}
              <g transform="translate(330,18)">
                <rect x="0" y="0" width="42" height="26" rx="5" fill={tokens.amber} fillOpacity="0.16" stroke={tokens.amber} strokeOpacity="0.7" />
                <rect x="7" y="7" width="28" height="12" rx="2" fill={tokens.amber} fillOpacity="0.85" />
              </g>
              <circle cx="366" cy="34" r="14" fill={tokens.amber} fillOpacity="0.1" />

              <g transform="translate(150,150)">
                <rect x="0" y="0" width="132" height="30" rx="8" fill="#fff" fillOpacity="0.06" stroke="#fff" strokeOpacity="0.14" />
                <circle cx="16" cy="15" r="3.5" fill={tokens.green} />
                <text x="28" y="19" fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily="inherit" fontWeight="600">
                  Campaign active
                </text>
              </g>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* FOOTER
            Navigation, not a second closing pitch. The old one repeated the CTA as two stacked
            buttons directly beneath the CTA that had just made the same offer, and put Admin Login
            in the Company column beside About and Contact as though it were a public page. One
            compact button here, two text links, and the admin entrance moved to the utility row.

            Privacy and Terms are not linked. There are no routes for them and no catch-all, so a
            link would land on a blank screen — worse than no link, and worse still for the two
            pages a visitor is most entitled to expect to exist. */}
      <Box component="footer" sx={{ backgroundColor: tokens.surface, borderTop: `1px solid ${tokens.border}` }}>
        <Container maxWidth={false} sx={{ maxWidth: 1280, mx: 'auto', px: 'clamp(20px,5vw,64px)', pt: { xs: '44px', md: '56px' }, pb: '28px' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1fr 1.2fr' },
              gap: { xs: '34px', md: '40px' },
              pb: { xs: '32px', md: '40px' },
            }}
          >
            <Box>
              <Box sx={{ mb: '14px' }}>
                <Logo size="md" />
              </Box>
              <Typography sx={{ fontSize: 14, color: tokens.navy, lineHeight: 1.6, maxWidth: '26ch', fontWeight: 500 }}>
                Moving digital advertising, built for Lebanon&rsquo;s roads.
              </Typography>
              <Typography sx={{ mt: '10px', fontSize: 13, color: tokens.textMuted }}>Beirut, Lebanon</Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.textMuted, mb: '14px' }}
              >
                Platform
              </Typography>
              {/* The same list the header uses, so a rename cannot leave the two disagreeing —
                  which is exactly how the footer ended up still saying "Taxi Companies". */}
              <Box sx={{ display: 'grid', gap: '10px' }}>
                {NAV_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} underline="hover" sx={{ fontSize: 14, color: tokens.navy }}>
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.textMuted, mb: '14px' }}
              >
                Company
              </Typography>
              <Box sx={{ display: 'grid', gap: '10px' }}>
                <Link href="#about" underline="hover" sx={{ fontSize: 14, color: tokens.navy }}>
                  About
                </Link>
                <Link href="#contact" underline="hover" sx={{ fontSize: 14, color: tokens.navy }}>
                  Contact
                </Link>
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.textMuted, mb: '14px' }}
              >
                Get started
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy, mb: '12px' }}>Ready to launch?</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/signup?role=advertiser')}
                sx={{
                  mb: '14px',
                  '& .arrow': { transition: 'transform .2s ease' },
                  '&:hover .arrow': { transform: 'translateX(3px)' },
                  '@media (prefers-reduced-motion: reduce)': { '& .arrow': { transition: 'none' } },
                }}
              >
                Launch a campaign
                <Box component="span" className="arrow" aria-hidden sx={{ ml: '7px', fontSize: 15, lineHeight: 1 }}>
                  &rarr;
                </Box>
              </Button>
              <Box sx={{ display: 'grid', gap: '9px' }}>
                <Link
                  component={RouterLink}
                  to="/signup?role=driver"
                  underline="hover"
                  sx={{ fontSize: 13.5, color: tokens.navy, fontWeight: 500 }}
                >
                  Become a driver partner &rarr;
                </Link>
                <Link
                  component={RouterLink}
                  to="/signup?role=taxiCompany"
                  underline="hover"
                  sx={{ fontSize: 13.5, color: tokens.navy, fontWeight: 500 }}
                >
                  Partner your fleet &rarr;
                </Link>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              pt: '22px',
              borderTop: `1px solid ${tokens.border}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: tokens.textMuted }}>
              &copy; 2026 AdzOnRoad &middot; Beirut, Lebanon
            </Typography>
            {/* The way in for the people who run the platform, kept plain and unhighlighted —
                it is a staff entrance, not a page anyone browsing the site is looking for. */}
            <Link
              component={RouterLink}
              to="/login?role=admin"
              underline="hover"
              sx={{ fontSize: 12.5, color: tokens.textMuted, '&:hover': { color: tokens.navy } }}
            >
              Admin login
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
