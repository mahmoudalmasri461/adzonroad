import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import UploadIcon from '@mui/icons-material/Upload';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import { CreativeLibraryCard, useCreatives } from '../../components/advertiser/CreativePerformanceCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { useToast } from '../../contexts/ToastProvider';
import { fetchCampaigns, uploadCreative, type CampaignSummary } from '../../services/campaigns';
import { canAcceptCreatives } from '../../services/creatives';
import { ApiError } from '../../services/apiClient';

/** What the API accepts. Stated here so the picker refuses a file before uploading megabytes of it. */
const ACCEPTED = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
const MAX_BYTES = 200 * 1024 * 1024;

function CreativesContent() {
  const { showToast } = useToast();
  const { creatives, state, reload } = useCreatives();

  const [draftCampaigns, setDraftCampaigns] = useState<CampaignSummary[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchCampaigns(controller.signal)
      .then((campaigns) => {
        if (controller.signal.aborted) return;

        const editable = campaigns.filter((c) => canAcceptCreatives(c.status));
        setDraftCampaigns(editable);
        setCampaignId((current) => current || editable[0]?.campaignId || '');
      })
      .catch(() => undefined);

    // Loaded once: uploading a creative does not change which campaigns are drafts.
    return () => controller.abort();
  }, []);

  const canUpload = draftCampaigns.length > 0 && Boolean(campaignId) && !uploading;

  async function handleFile(file: File | undefined) {
    if (!file || !campaignId) return;

    if (file.size > MAX_BYTES) {
      showToast(`${file.name} is larger than the 200 MB limit.`);
      return;
    }

    const campaign = draftCampaigns.find((c) => c.campaignId === campaignId);

    setUploading(true);
    try {
      // The campaign's own duration, so a creative cannot be attached at a length that would fail
      // the check at submission and send the advertiser back round the loop.
      await uploadCreative(campaignId, file, campaign?.creativeDurationSeconds ?? 15);
      showToast(`${file.name} added to ${campaign?.name ?? 'the campaign'}.`);
      reload();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'That upload did not go through.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>
            Creatives
          </Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
            Your uploaded ads and how each one has actually played.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {draftCampaigns.length > 0 && (
            <TextField
              select
              size="small"
              label="Add to campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              sx={{ minWidth: 220, backgroundColor: '#fff' }}
            >
              {draftCampaigns.map((c) => (
                <MenuItem key={c.campaignId} value={c.campaignId}>
                  {c.name} · {c.creativeDurationSeconds}s
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button
            startIcon={uploading ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <UploadIcon />}
            disabled={!canUpload}
            onClick={() => fileInput.current?.click()}
            sx={{
              backgroundColor: advTokens.orange,
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { backgroundColor: advTokens.orangeHover },
              '&.Mui-disabled': { backgroundColor: '#E4E2DD', color: advTokens.textMuted },
            }}
          >
            {uploading ? 'Uploading…' : 'Upload creative'}
          </Button>
        </Box>
      </Box>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED}
        hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {/*
        A creative belongs to a campaign, and only a draft accepts one — what runs has to be what a
        reviewer approved. With no draft open there is nowhere to put a file, so the page says that
        rather than offering a control that cannot work.
      */}
      {draftCampaigns.length === 0 ? (
        <Alert severity="info" sx={{ mb: '24px', fontSize: 13 }}>
          Creatives are uploaded into a campaign, and a campaign only accepts them while it is a
          draft. Create a campaign, or withdraw one back to draft, to add artwork.
        </Alert>
      ) : (
        <Box
          sx={{
            ...cardSx,
            mb: '24px',
            border: `1.5px dashed ${advTokens.border}`,
            boxShadow: 'none',
            padding: '32px',
            textAlign: 'center',
            color: advTokens.textMuted,
            cursor: uploading ? 'progress' : 'pointer',
            '&:hover': { borderColor: advTokens.orange },
          }}
          onClick={() => { if (canUpload) fileInput.current?.click(); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (canUpload) void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <Typography sx={{ fontWeight: 700, color: advTokens.text, mb: '4px' }}>
            Drop creative assets here
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            MP4, MOV, PNG, JPG or WebP — up to 200 MB
          </Typography>
        </Box>
      )}

      {state === 'ready' && creatives.length > 0 && (
        <Typography sx={{ fontSize: 12.5, color: advTokens.textMuted, mb: '10px' }}>
          {creatives.length} {creatives.length === 1 ? 'creative' : 'creatives'} across your campaigns.
        </Typography>
      )}

      <CreativeLibraryCard creatives={creatives} state={state} />
    </>
  );
}

export default function CreativesPage() {
  return (
    <AdvertiserLayout title="Creatives">
      <CreativesContent />
    </AdvertiserLayout>
  );
}
