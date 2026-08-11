/**
 * Turning a photographed document into something that can travel in a JSON body.
 *
 * The registration endpoint takes three images as base64 inside one request. A phone camera
 * produces four to eight megabytes per photo, and base64 adds a third on top — so sending them
 * untouched is a twenty-megabyte upload from a driver standing on a street in Beirut. Downscaling
 * in the browser is the difference between a form that submits and one that times out.
 *
 * The rule is that a document must stay readable: an identity card has to be legible enough for an
 * admin to review it, so this shrinks and re-encodes rather than aggressively compressing.
 */

export const IMAGE_POLICY = {
  /**
   * Longest edge after scaling. A national ID photographed at 1600px across is comfortably
   * readable; beyond that the extra pixels are the phone's, not the document's.
   */
  maxEdgePixels: 1600,

  /** JPEG quality. High enough that text stays sharp, low enough to matter. */
  quality: 0.82,

  /**
   * Refused outright above this. Not a technical limit — a 25 MB file is a video, a screenshot of
   * a photo library, or a mistake, and failing fast beats a two-minute upload that ends in an error.
   */
  maxSourceBytes: 25 * 1024 * 1024,
} as const;

export class ImageTooLargeError extends Error {
  readonly bytes: number;

  constructor(bytes: number) {
    super('That image is too large. Please choose a photo under 25 MB.');
    this.name = 'ImageTooLargeError';
    this.bytes = bytes;
  }
}

/**
 * Dimensions to draw at, preserving aspect ratio.
 *
 * Images already within the limit are left alone — upscaling a small photo would add bytes and no
 * information, which is the wrong trade in both directions.
 */
export function scaledDimensions(
  width: number,
  height: number,
  maxEdge = IMAGE_POLICY.maxEdgePixels,
): { width: number; height: number } {
  const longest = Math.max(width, height);

  if (longest <= maxEdge || longest === 0) return { width, height };

  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Bytes a base64 string represents, so a size can be reported without decoding it. */
export function base64Bytes(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, (base64.length * 3) / 4 - padding);
}

/** Strips the `data:image/jpeg;base64,` prefix — the API wants the payload, not the data URL. */
export function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

/**
 * Reads a chosen file, scales it down, and returns bare base64 JPEG.
 *
 * Everything decidable is decided by the pure helpers above; this is the thin part that touches a
 * canvas and therefore cannot be tested without a browser.
 */
export async function toCompressedBase64(file: File): Promise<string> {
  if (file.size > IMAGE_POLICY.maxSourceBytes) throw new ImageTooLargeError(file.size);

  const bitmap = await loadImage(file);
  const size = scaledDimensions(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process the image in this browser.');

  context.drawImage(bitmap, 0, 0, size.width, size.height);

  return stripDataUrlPrefix(canvas.toDataURL('image/jpeg', IMAGE_POLICY.quality));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };

    image.src = url;
  });
}
