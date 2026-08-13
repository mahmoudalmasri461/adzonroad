import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import { advTokens } from './theme';
import { fetchCreativePreview, type CreativeListItem } from '../../services/creatives';

/**
 * A creative's own artwork, rather than a coloured rectangle standing in for it.
 *
 * The bytes are behind a bearer token, so they cannot be given to an `<img src>` directly — they
 * are fetched and wrapped in an object URL. That URL is revoked on unmount: one held per row would
 * keep every image in the library alive in memory for as long as the page is open.
 *
 * Videos show an icon rather than a decoded frame. Extracting a poster frame means loading the
 * whole file to seek it, which is megabytes per row for a thumbnail nobody asked to play.
 */
export default function CreativeThumbnail({
  creative, width = 44, height = 32,
}: {
  creative: CreativeListItem; width?: number; height?: number;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = creative.type === 'Image';

  useEffect(() => {
    if (!isImage) return;

    const controller = new AbortController();
    let created: string | null = null;

    fetchCreativePreview(creative.creativeId, controller.signal)
      .then((objectUrl) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        created = objectUrl;
        setPreviewUrl(objectUrl);
      })
      // A creative whose file has gone missing falls back to the icon rather than breaking the row.
      .catch(() => undefined);

    return () => {
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [creative.creativeId, isImage]);

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: '8px',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: advTokens.charcoal,
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={creative.name}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : isImage ? (
        <ImageIcon sx={{ fontSize: 16 }} />
      ) : (
        <VideocamIcon sx={{ fontSize: 16 }} />
      )}
    </Box>
  );
}
