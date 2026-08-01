import { useMemo, useState } from 'react';
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
import Logo from '../components/Logo';
import LebanonMap from '../components/LebanonMap';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
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

const PARTNER_PLACEHOLDERS = ['Advertising Clients', 'Taxi Companies', 'Driver Partners', 'Lebanese Business Partners'];

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

function SectionEyebrow({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.blue, mb: '10px' }}>
      {children}
    </Typography>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(24);
  const [drivesPremiumAreas, setDrivesPremiumAreas] = useState(true);

  const BASE_PAY = 30;
  const HOURLY_RATE = 0.6;
  const PREMIUM_AREA_BONUS = 20;

  const { total, base, hourlyEarnings, premiumBonus } = useMemo(() => {
    const totalHours = hours * days;
    const hourlyEarningsVal = totalHours * HOURLY_RATE;
    const premiumBonusVal = drivesPremiumAreas ? PREMIUM_AREA_BONUS : 0;
    return {
      base: BASE_PAY,
      hourlyEarnings: Math.round(hourlyEarningsVal),
      premiumBonus: premiumBonusVal,
      total: Math.round(BASE_PAY + hourlyEarningsVal + premiumBonusVal),
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
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
            sx={{ borderColor: tokens.border, color: tokens.text }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: tokens.navy, color: '#fff', '&:hover': { backgroundColor: tokens.navy700 } }}
            onClick={() => navigate('/signup?role=advertiser')}
          >
            Launch Campaign
          </Button>
        </Box>
      </Box>

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
                gridTemplateColumns: 'repeat(4,1fr)',
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
            <Typography sx={{ fontWeight: 700, fontSize: 30, mb: '32px', letterSpacing: '-0.01em' }}>Two journeys, one platform</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '24px' }}>
              <StepCard title="For advertisers" steps={ADVERTISER_STEPS} badgeBg="#EAF0FF" badgeColor={tokens.blue} />
              <StepCard title="For drivers" steps={DRIVER_STEPS} badgeBg="#FEF3E2" badgeColor={tokens.amber600} />
            </Box>
          </Box>
        </Reveal>

        {/* COVERAGE MAP */}
        <Reveal>
          <Box component="section" id="coverage" sx={{ py: '64px' }}>
            <SectionEyebrow>Live network</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 30, mb: '10px', letterSpacing: '-0.01em' }}>Coverage across Lebanon</Typography>
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

        {/* WHY ADZONROAD */}
        <Reveal>
          <Box component="section" sx={{ py: '64px' }}>
            <SectionEyebrow>Why AdzOnRoad</SectionEyebrow>
            <Typography sx={{ fontWeight: 700, fontSize: 30, mb: '28px', letterSpacing: '-0.01em' }}>Built for measurable results</Typography>
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
          <Typography sx={{ fontWeight: 700, fontSize: 30, mb: '28px', letterSpacing: '-0.01em' }}>Estimate what you could earn</Typography>
          <Card sx={{ p: '32px' }}>
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
                <Typography sx={{ mt: '6px', mb: '18px', fontWeight: 800, fontSize: 44, color: tokens.navy }}>${total}</Typography>
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

        {/* TESTIMONIAL */}
        <Reveal>
          <Box component="section" sx={{ pt: '40px', pb: '64px' }}>
            <Typography
              component="blockquote"
              sx={{ fontWeight: 700, fontSize: 'clamp(22px,2.2vw,28px)', lineHeight: 1.5, letterSpacing: '-0.01em', maxWidth: '32ch', m: 0, mb: '16px', color: tokens.navy }}
            >
              &ldquo;AdzOnRoad let us reach every neighborhood in Beirut without buying a single billboard.&rdquo;
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: '32px' }}>— Marketing lead, Lebanese retail client</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px' }}>
              {PARTNER_PLACEHOLDERS.map((p) => (
                <Box
                  key={p}
                  sx={{
                    border: `1px dashed ${tokens.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontSize: 13,
                  }}
                >
                  {p}
                </Box>
              ))}
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
