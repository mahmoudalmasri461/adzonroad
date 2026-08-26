import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MuiTooltip from '@mui/material/Tooltip';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TvIcon from '@mui/icons-material/Tv';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmptyState from './EmptyState';
import { advTokens, cardSx } from './theme';
import { usePortfolio } from './PortfolioContext';
import { formatScreenTime, verifiedShare } from '../../services/advertiserAnalytics';

/**
 * What the platform will and will not stand behind.
 *
 * Every claim in the period lands in exactly one of the three buckets, and they add up to the
 * total — the fixture this replaced counted screens instead, so "3 Live Verified" described a
 * number of devices while sitting under a heading about delivery.
 *
 * Screen-confirmed and device-declared are shown separately because they are not equally strong
 * evidence, and an advertiser is entitled to know how much of their delivery rests on a driver's
 * phone rather than on the screen itself.
 */
export default function VerificationStatusCard() {
  const { portfolio, state, days } = usePortfolio();

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Trust &amp; verification
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '4px' }}>
        Verified Delivery
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '16px' }}>
        Every claimed play in the last {days} days, in exactly one bucket
      </Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your verification figures.</Alert>
      )}

      {state === 'ready' && portfolio !== null && (
        portfolio.totalClaims === 0 ? (
          <EmptyState
            title="Nothing claimed yet"
            description="When your campaigns start playing, every claim and the evidence behind it appears here."
          />
        ) : (
          <>
            <Box sx={{ display: 'grid', gap: '12px', mb: '18px' }}>
              <Signal
                icon={PlayCircleIcon}
                label="Verified against GPS evidence"
                value={`${Math.round(verifiedShare(portfolio) * 100)}%`}
                color={advTokens.green}
                hint="A play counts only when a GPS fix brackets it on a screen that was online."
              />
              <Signal
                icon={GpsFixedIcon}
                label="Confirmed screen time"
                value={formatScreenTime(portfolio.verifiedSeconds)}
                color={advTokens.text}
                hint="Seconds of playback the evidence supports. Billing counts these and nothing else."
              />
              <Signal
                icon={TvIcon}
                label="Confirmed by screen hardware"
                value={portfolio.screenConfirmedPlays.toLocaleString()}
                color={advTokens.text}
                hint="The screen itself reported the play. The strongest evidence the platform has."
              />
              <Signal
                icon={PhoneAndroidIcon}
                label="Declared by the driver's phone"
                value={portfolio.deviceDeclaredPlays.toLocaleString()}
                color={portfolio.deviceDeclaredPlays > 0 ? advTokens.amber : advTokens.text}
                hint="Reported by the driver app rather than the screen. Still evidence-checked, but weaker."
              />
            </Box>

            <Box sx={{ display: 'flex', gap: '8px', pt: '14px', borderTop: `1px solid ${advTokens.border}` }}>
              <Bucket label="Verified" count={portfolio.verifiedPlays} color={advTokens.green} />
              <Bucket label="Awaiting evidence" count={portfolio.pendingEvidencePlays} color={advTokens.blue} />
              <Bucket label="Not verified" count={portfolio.notVerifiedPlays} color={advTokens.red} />
            </Box>
          </>
        )
      )}
    </Box>
  );
}

function Signal({
  icon: Icon, label, value, color, hint,
}: {
  icon: React.ComponentType<{ sx?: object }>;
  label: string;
  value: string;
  color: string;
  hint: string;
}) {
  return (
    <MuiTooltip title={hint}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'help' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Icon sx={{ fontSize: 17, color: advTokens.textMuted, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: advTokens.text }} noWrap>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{value}</Typography>
      </Box>
    </MuiTooltip>
  );
}

function Bucket({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Box sx={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: '10px', backgroundColor: advTokens.bg }}>
      <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>{count.toLocaleString()}</Typography>
      <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}
