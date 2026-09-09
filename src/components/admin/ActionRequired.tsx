import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSharedReviewCounts } from '../../contexts/ReviewCountsProvider';
import { tokens } from '../../theme';

/**
 * What is waiting on a decision.
 *
 * The panel this replaced was a tabbed card that stood over 300px tall whether or not anything
 * was in it, so the most important question on the page — is there anything for me to do? — was
 * answered by scrolling past a lot of nothing. Empty is now a single line.
 *
 * Counts come from the same hook the sidebar badges use, so the two cannot disagree.
 */

const QUEUES = [
  { key: 'driver', labelKey: 'admin.nav.drivers', href: '/admin/drivers' },
  { key: 'advertiser', labelKey: 'admin.nav.advertisers', href: '/admin/advertisers' },
  { key: 'fleet', labelKey: 'admin.nav.fleetPartners', href: '/admin/taxi-companies' },
  { key: 'campaign', labelKey: 'admin.nav.campaigns', href: '/admin/campaigns' },
] as const;

export default function ActionRequired() {
  const { t } = useTranslation();
  const review = useSharedReviewCounts();

  if (review.status === 'loading') {
    return <Shell><SkeletonRow /></Shell>;
  }

  if (review.status === 'error') {
    // Not "0 waiting": nobody knows whether the queues are clear.
    return (
      <Shell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>
              {t('admin.states.errorTitle')}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, mt: '2px' }}>
              {t('admin.states.errorDetail')}
            </Typography>
          </Box>
          <Button onClick={review.reload} size="small" variant="outlined" sx={{ borderColor: '#DDD9D1', color: tokens.navy, borderRadius: '8px' }}>
            {t('admin.states.retry')}
          </Button>
        </Box>
      </Shell>
    );
  }

  if (review.total === 0) {
    return (
      <Shell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#0F7A3D', flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>
              {t('admin.actionRequired.none')}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: tokens.textMuted }}>
              {t('admin.actionRequired.noneDetail')}
            </Typography>
          </Box>
        </Box>
      </Shell>
    );
  }

  return (
    <Shell>
      <Box sx={{ display: 'grid', gap: '2px' }}>
        {QUEUES.filter((q) => review.counts[q.key] > 0).map((q) => (
          <Box
            key={q.key}
            component={RouterLink}
            to={q.href}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 8px',
              borderRadius: '8px',
              textDecoration: 'none',
              '&:hover': { backgroundColor: '#F4F2EE' },
            }}
          >
            <Typography
              sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: tokens.navy }}
            >
              {t(q.labelKey)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, color: tokens.textMuted }}>
                {t('admin.actionRequired.waiting', { count: review.counts[q.key] })}
              </Typography>
              <Box
                component="span"
                sx={{
                  minWidth: 22,
                  height: 20,
                  px: '7px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(245,166,35,0.16)',
                  color: tokens.navy,
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  direction: 'ltr',
                }}
              >
                {review.counts[q.key]}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        border: '1px solid #E7E4DE',
        borderRadius: '10px',
        padding: '16px 18px',
      }}
    >
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.amber600, mb: '3px' }}
      >
        {t('admin.actionRequired.title')}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, mb: '12px' }}>
        {t('admin.actionRequired.subtitle')}
      </Typography>
      {children}
    </Box>
  );
}

function SkeletonRow() {
  return (
    <Box sx={{ display: 'grid', gap: '8px' }}>
      {[0, 1].map((i) => (
        <Box
          key={i}
          sx={{
            height: 20,
            borderRadius: '6px',
            backgroundColor: '#F1EFEA',
            '@keyframes adzPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
            animation: 'adzPulse 1.4s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
      ))}
    </Box>
  );
}
