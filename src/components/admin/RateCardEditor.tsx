import { useMemo, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import StarIcon from '@mui/icons-material/StarRounded';
import EmptyState from '../EmptyState';
import ConfirmationDialog from '../ConfirmationDialog';
import { useIsMobile } from '../../hooks/useIsMobile';
import { formatCurrency } from '../../utils/format';
import {
  blankAdvertisingOffer,
  blankDriverPayItem,
  blankFleetOffer,
  describeBand,
  monthlyDriverPay,
  rulePriceOf,
  DRIVER_PAY_UNITS,
  type AdvertisingOffer,
  type DriverPayItem,
  type FleetOffer,
  type RateCard,
} from '../../services/rateCard';
import { tokens } from '../../theme';

/**
 * The rate card, edited.
 *
 * One dialog serves all three lists, driven by a field descriptor per audience, because the three
 * forms differ only in their fields — three hand-written dialogs would be the same dialog three
 * times, drifting apart the first time one of them gains a validation rule.
 */

type FieldDef = {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'currency' | 'percent' | 'switch' | 'select';
  help?: string;
  /** `select` only. */
  options?: (string | number)[];
  /** Numbers only: an empty field stores null rather than 0 — used for open-ended bands. */
  nullable?: boolean;
  multiline?: boolean;
  /** Lays the field across both columns. */
  wide?: boolean;
};

/**
 * Checks each `key` against the shape it edits, then widens to a plain `FieldDef[]` so one
 * renderer can walk all three lists. Without this the keys would be free-form strings and a typo
 * would only surface as a field that silently edits nothing.
 */
const fieldsOf = <T,>(defs: (Omit<FieldDef, 'key'> & { key: Extract<keyof T, string> })[]): FieldDef[] => defs;

/** The draft is a union of three interfaces; the renderer only needs it keyed by string. */
const read = (item: object, key: string): unknown => (item as Record<string, unknown>)[key];

const ADVERTISING_FIELDS = fieldsOf<AdvertisingOffer>([
  { key: 'name', label: 'Offer name', kind: 'text' },
  { key: 'price', label: 'Price', kind: 'currency', help: 'What this package sells for.' },
  { key: 'taxiCount', label: 'Taxis', kind: 'number' },
  { key: 'durationSeconds', label: 'Ad length', kind: 'select', options: [15, 30, 45, 60, 75, 90] },
  { key: 'regionsIncluded', label: 'Regions included', kind: 'number', help: 'Beyond this, the surcharge applies.' },
  { key: 'featured', label: 'Feature on the public pricing section', kind: 'switch', wide: true },
  { key: 'notes', label: 'What the buyer gets', kind: 'text', multiline: true, wide: true },
]);

const DRIVER_FIELDS = fieldsOf<DriverPayItem>([
  { key: 'name', label: 'Component', kind: 'text' },
  { key: 'amount', label: 'Amount', kind: 'currency' },
  { key: 'unit', label: 'Paid', kind: 'select', options: DRIVER_PAY_UNITS },
  { key: 'condition', label: 'Only when', kind: 'text', help: 'Leave blank if it always applies.', wide: true },
]);

const FLEET_FIELDS = fieldsOf<FleetOffer>([
  { key: 'name', label: 'Band name', kind: 'text' },
  { key: 'perVehicleMonthlyUsd', label: 'Per vehicle, per month', kind: 'currency' },
  { key: 'minVehicles', label: 'From (vehicles)', kind: 'number' },
  { key: 'maxVehicles', label: 'To (vehicles)', kind: 'number', nullable: true, help: 'Blank means "and above".' },
  { key: 'revenueSharePercent', label: 'Revenue share', kind: 'percent', wide: true },
  { key: 'notes', label: 'What the company gets', kind: 'text', multiline: true, wide: true },
]);

type Editing =
  | { audience: 'advertising'; draft: AdvertisingOffer; isNew: boolean }
  | { audience: 'drivers'; draft: DriverPayItem; isNew: boolean }
  | { audience: 'fleets'; draft: FleetOffer; isNew: boolean };

type RateCardEditorProps = {
  card: RateCard;
  onChange: (next: RateCard) => void;
};

export default function RateCardEditor({ card, onChange }: RateCardEditorProps) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<{ audience: keyof Pick<RateCard, 'advertising' | 'drivers' | 'fleets'>; id: string; name: string } | null>(null);

  const monthly = useMemo(() => monthlyDriverPay(card.drivers), [card.drivers]);

  const commit = () => {
    if (!editing) return;

    const list = card[editing.audience] as { id: string }[];
    const next = editing.isNew
      ? [...list, editing.draft]
      : list.map((item) => (item.id === editing.draft.id ? editing.draft : item));

    onChange({ ...card, [editing.audience]: next });
    setEditing(null);
  };

  const remove = () => {
    if (!removing) return;
    const list = card[removing.audience] as { id: string }[];
    onChange({ ...card, [removing.audience]: list.filter((item) => item.id !== removing.id) });
    setRemoving(null);
  };

  const fields =
    editing?.audience === 'advertising' ? ADVERTISING_FIELDS
      : editing?.audience === 'drivers' ? DRIVER_FIELDS
        : FLEET_FIELDS;

  const draftName = editing ? editing.draft.name : '';

  return (
    <Card sx={{ p: 0 }}>
      <Box sx={{ px: { xs: '16px', sm: '22px' }, pt: '18px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          What we sell, and what we pay
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Price lists</Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, next) => setTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: { xs: '8px', sm: '14px' },
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13.5, minHeight: 46 },
        }}
      >
        <Tab label={`Advertising (${card.advertising.length})`} />
        <Tab label={`Driver pay (${card.drivers.length})`} />
        <Tab label={`Taxi companies (${card.fleets.length})`} />
      </Tabs>

      <Box sx={{ px: { xs: '16px', sm: '22px' }, py: '18px' }}>
        {tab === 0 && (
          <List
            empty="No advertising offers"
            emptyHint="Add one and it becomes a package the sales team can quote."
            onAdd={() => setEditing({ audience: 'advertising', draft: blankAdvertisingOffer(), isNew: true })}
            addLabel="Add offer"
            items={card.advertising.map((offer) => {
              const rule = rulePriceOf(offer, card);
              const differs = Math.round(rule) !== Math.round(offer.price);

              return {
                id: offer.id,
                title: offer.name || 'Untitled offer',
                badge: offer.featured ? <StarIcon sx={{ fontSize: 16, color: tokens.amber }} /> : null,
                meta: [
                  `${offer.taxiCount} taxis`,
                  `${offer.durationSeconds}s`,
                  offer.regionsIncluded === 1 ? '1 region' : `${offer.regionsIncluded} regions`,
                ],
                note: offer.notes,
                value: formatCurrency(offer.price),
                // The engine charges the rule, not the offer. A gap here is a discount somebody
                // has to honour by hand, so it is called out rather than left to be discovered.
                valueNote: differs ? `engine charges ${formatCurrency(rule)}` : 'matches the engine',
                valueTone: differs ? tokens.warn : tokens.textMuted,
                onEdit: () => setEditing({ audience: 'advertising', draft: { ...offer }, isNew: false }),
                onRemove: () => setRemoving({ audience: 'advertising', id: offer.id, name: offer.name || 'this offer' }),
              };
            })}
          />
        )}

        {tab === 1 && (
          <>
            <Alert severity="info" sx={{ fontSize: 12.5, mb: '14px' }}>
              A driver working 8 hours a day, 24 days a month takes home{' '}
              <strong>{formatCurrency(monthly)}</strong> on this card. One-off components are not
              counted in that figure.
            </Alert>
            <List
              empty="No pay components"
              emptyHint="Add one and it becomes part of what every driver is owed."
              onAdd={() => setEditing({ audience: 'drivers', draft: blankDriverPayItem(), isNew: true })}
              addLabel="Add component"
              items={card.drivers.map((item) => ({
                id: item.id,
                title: item.name || 'Untitled component',
                badge: null,
                meta: [item.unit],
                note: item.condition ? `Only when: ${item.condition}` : 'Always applies',
                value: formatCurrency(item.amount),
                valueNote: item.unit,
                valueTone: tokens.textMuted,
                onEdit: () => setEditing({ audience: 'drivers', draft: { ...item }, isNew: false }),
                onRemove: () => setRemoving({ audience: 'drivers', id: item.id, name: item.name || 'this component' }),
              }))}
            />
          </>
        )}

        {tab === 2 && (
          <List
            empty="No fleet bands"
            emptyHint="Add one and it becomes the terms a taxi company is signed on."
            onAdd={() => setEditing({ audience: 'fleets', draft: blankFleetOffer(), isNew: true })}
            addLabel="Add band"
            items={card.fleets.map((offer) => ({
              id: offer.id,
              title: offer.name || 'Untitled band',
              badge: null,
              meta: [describeBand(offer), `${offer.revenueSharePercent}% revenue share`],
              note: offer.notes,
              value: formatCurrency(offer.perVehicleMonthlyUsd),
              valueNote: 'per vehicle / month',
              valueTone: tokens.textMuted,
              onEdit: () => setEditing({ audience: 'fleets', draft: { ...offer }, isNew: false }),
              onRemove: () => setRemoving({ audience: 'fleets', id: offer.id, name: offer.name || 'this band' }),
            }))}
          />
        )}
      </Box>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>
          {editing?.isNew ? 'New entry' : draftName || 'Edit entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            {editing && fields.map((field) => (
              <Box key={field.key} sx={{ gridColumn: field.wide ? { sm: '1 / -1' } : 'auto' }}>
                <Field
                  field={field}
                  value={read(editing.draft, field.key)}
                  onChange={(value) =>
                    setEditing({ ...editing, draft: { ...editing.draft, [field.key]: value } } as Editing)
                  }
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditing(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={commit} disabled={draftName.trim().length === 0}>
            {editing?.isNew ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={removing !== null}
        title="Remove this entry?"
        description={`${removing?.name ?? 'It'} will be taken off the rate card. Nothing already quoted or agreed changes.`}
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------- pieces

type ListItem = {
  id: string;
  title: string;
  badge: ReactNode;
  meta: string[];
  note: string;
  value: string;
  valueNote: string;
  valueTone: string;
  onEdit: () => void;
  onRemove: () => void;
};

function List({
  items,
  empty,
  emptyHint,
  onAdd,
  addLabel,
}: {
  items: ListItem[];
  empty: string;
  emptyHint: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <>
      {items.length === 0 ? (
        <EmptyState title={empty} description={emptyHint} />
      ) : (
        <Box sx={{ display: 'grid', gap: '8px' }}>
          {items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 0,
              }}
            >
              <Box sx={{ flex: '1 1 190px', minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.title}</Typography>
                  {item.badge}
                </Box>
                <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', mt: '6px' }}>
                  {item.meta.map((bit) => (
                    <Chip
                      key={bit}
                      size="small"
                      label={bit}
                      sx={{ height: 21, fontSize: 11.5, fontWeight: 600, backgroundColor: '#F1F2F6', color: tokens.textMuted }}
                    />
                  ))}
                </Box>
                {item.note && (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '8px' }}>{item.note}</Typography>
                )}
              </Box>

              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{ fontSize: 17, fontWeight: 800 }}>{item.value}</Typography>
                <Typography sx={{ fontSize: 11.5, color: item.valueTone }}>{item.valueNote}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={item.onEdit} aria-label={`Edit ${item.title}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={item.onRemove} aria-label={`Remove ${item.title}`}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Button
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mt: '14px', textTransform: 'none', fontWeight: 700 }}
      >
        {addLabel}
      </Button>
    </>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.kind === 'switch') {
    return (
      <FormControlLabel
        control={<Switch checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />}
        label={<Typography sx={{ fontSize: 13.5 }}>{field.label}</Typography>}
      />
    );
  }

  if (field.kind === 'select') {
    return (
      <TextField
        select
        fullWidth
        label={field.label}
        helperText={field.help}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          const asNumber = Number(raw);
          onChange(field.options?.every((o) => typeof o === 'number') ? asNumber : raw);
        }}
      >
        {(field.options ?? []).map((option) => (
          <MenuItem key={String(option)} value={option}>
            {typeof option === 'number' ? `${option} seconds` : option}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.kind === 'text') {
    return (
      <TextField
        fullWidth
        label={field.label}
        helperText={field.help}
        multiline={field.multiline}
        minRows={field.multiline ? 2 : undefined}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // number / currency / percent
  const suffix = field.kind === 'currency' ? { startAdornment: <Box sx={{ mr: '6px', color: 'text.secondary' }}>$</Box> } : field.kind === 'percent' ? { endAdornment: <Box sx={{ ml: '6px', color: 'text.secondary' }}>%</Box> } : {};

  return (
    <TextField
      fullWidth
      type="number"
      label={field.label}
      helperText={field.help}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange(field.nullable ? null : 0);
          return;
        }
        const parsed = Number(raw);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      slotProps={{ input: suffix }}
    />
  );
}
