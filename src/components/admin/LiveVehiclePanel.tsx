import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import StatusTag from '../StatusTag';
import { describeAge, type RenderedVehicle } from '../../services/vehicleInterpolation';
import { describeLastSignal, readableStatus, toneForStatus, type AdminScreen, type Assignment, type LiveVehicle } from '../../services/admin';
import { tokens } from '../../theme';

/**
 * The list of vehicles, and everything the platform can honestly say about the selected one.
 *
 * The joins are by plate, which is the only key shared between the three sources: a live position
 * carries a plate, a screen record carries the plate it is fitted to, and an assignment carries
 * the plate it was made against. Where a plate is missing the row simply says so rather than
 * guessing — an operator dispatching against this needs the gaps to be visible.
 *
 * Device health is deliberately absent here. That table is keyed on driver id and a live vehicle
 * carries no driver id, so there is no honest way to attach a device to a vehicle; the page keeps
 * device health as its own table rather than implying a link that does not exist.
 */

export type VehicleRow = {
  vehicle: RenderedVehicle;
  meta: LiveVehicle | undefined;
  screen: AdminScreen | undefined;
  assignment: Assignment | undefined;
  label: string;
};

const PRESENTATION_TONE = { live: 'live', stale: 'warn', offline: 'error' } as const;

export default function LiveVehiclePanel({
  rows,
  selectedId,
  onSelect,
}: {
  rows: VehicleRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const selected = rows.find((r) => r.vehicle.vehicleId === selectedId) ?? null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ px: '14px', py: '11px', borderBottom: '1px solid #EFEDE8', flexShrink: 0 }}>
        <Typography
          sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMuted }}
        >
          {t('admin.liveOps.panel.vehicles')}
          <Box component="span" sx={{ ml: '6px', color: tokens.navy, direction: 'ltr', display: 'inline-block' }}>
            {rows.length}
          </Box>
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {rows.length === 0 ? (
          <Box sx={{ p: '22px 16px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.navy }}>
              {t('admin.liveOps.panel.none')}
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.textMuted, mt: '3px' }}>
              {t('admin.liveOps.panel.noneDetail')}
            </Typography>
          </Box>
        ) : (
          rows.map((row) => {
            const active = row.vehicle.vehicleId === selectedId;
            return (
              <Box
                key={row.vehicle.vehicleId}
                component="button"
                type="button"
                onClick={() => onSelect(row.vehicle.vehicleId)}
                data-active={active ? 'true' : undefined}
                sx={{
                  width: '100%',
                  textAlign: 'start',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  border: 0,
                  borderBottom: '1px solid #F4F2EE',
                  background: 'none',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  '&:hover': { backgroundColor: '#FBFAF8' },
                  '&[data-active="true"]': { backgroundColor: 'rgba(245,166,35,0.10)' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.navy, direction: 'ltr', textAlign: 'start' }} noWrap>
                    {row.label}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: tokens.textMuted }} noWrap>
                    {row.meta?.driverName?.trim() || row.meta?.region || t('admin.liveOps.panel.unknownRegion')}
                  </Typography>
                </Box>
                <StatusTag
                  label={t(`admin.liveOps.presentation.${row.vehicle.presentation}`)}
                  variant={PRESENTATION_TONE[row.vehicle.presentation]}
                />
              </Box>
            );
          })
        )}
      </Box>

      <Box sx={{ flexShrink: 0, borderTop: '1px solid #EFEDE8', backgroundColor: '#FBFAF8', p: '14px' }}>
        {!selected ? (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>
              {t('admin.liveOps.panel.selectPrompt')}
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.textMuted, mt: '2px' }}>
              {t('admin.liveOps.panel.selectPromptDetail')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: '9px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: tokens.navy, direction: 'ltr' }}>
                {selected.label}
              </Typography>
              <StatusTag
                label={t(`admin.liveOps.presentation.${selected.vehicle.presentation}`)}
                variant={PRESENTATION_TONE[selected.vehicle.presentation]}
              />
            </Box>

            <Detail label={t('admin.liveOps.panel.driver')} value={selected.meta?.driverName?.trim() || '—'} />
            <Detail label={t('admin.liveOps.panel.region')} value={selected.meta?.region || t('admin.liveOps.panel.unknownRegion')} />
            <Detail
              label={t('admin.liveOps.panel.lastFix')}
              value={describeAge(selected.vehicle.fixAgeSeconds)}
              note={selected.vehicle.isDerived ? t('admin.liveOps.panel.derived') : t('admin.liveOps.panel.confirmed')}
            />
            {selected.meta && (
              <Detail label={t('admin.liveOps.panel.speed')} value={`${Math.round(selected.meta.speedKmh)} km/h`} ltr />
            )}

            {/* Joined on plate. Absent is stated, not hidden. */}
            <Detail
              label={t('admin.liveOps.panel.screen')}
              value={selected.screen?.serialNumber ?? t('admin.liveOps.panel.noScreen')}
              note={
                selected.screen
                  ? `${readableStatus(selected.screen.networkStatus)} · ${describeLastSignal(selected.screen.lastHeartbeatAtUtc)}`
                  : undefined
              }
              ltr={Boolean(selected.screen)}
            />

            <Detail
              label={t('admin.liveOps.panel.campaign')}
              value={selected.assignment?.campaignName ?? t('admin.liveOps.panel.noCampaign')}
              note={selected.assignment?.advertiser ?? undefined}
              tag={
                selected.assignment?.campaignStatus
                  ? {
                      label: readableStatus(selected.assignment.campaignStatus),
                      tone: toneForStatus(selected.assignment.campaignStatus),
                    }
                  : undefined
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Detail({
  label,
  value,
  note,
  ltr,
  tag,
}: {
  label: string;
  value: string;
  note?: string;
  /** Serials, plates and speeds are technical values and read left-to-right in both languages. */
  ltr?: boolean;
  tag?: { label: string; tone: 'live' | 'warn' | 'error' | 'neutral' | 'outline' };
}) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', mt: '1px' }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy, ...(ltr ? { direction: 'ltr' } : {}) }}
        >
          {value}
        </Typography>
        {tag && <StatusTag label={tag.label} variant={tag.tone} />}
      </Box>
      {note && <Typography sx={{ fontSize: 11.5, color: tokens.textMuted }}>{note}</Typography>}
    </Box>
  );
}
