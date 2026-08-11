import {
  API_BASE_URL,
  clearStoredAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './apiConfig';

/**
 * The REST side of the API. The hub client next door handles the live feed; this handles
 * everything that is asked for rather than pushed.
 */

/**
 * A failed request, with the status kept intact.
 *
 * The status matters to callers here in a way it usually does not: this API answers 404 for a
 * campaign that belongs to someone else, deliberately, so that a 403 cannot be used to enumerate
 * other advertisers' campaigns. A client that flattened everything to "request failed" would make
 * that indistinguishable from a typo.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

function url(path: string, query?: Record<string, string | number | undefined>): string {
  const target = new URL(path.replace(/^\//, ''), `${API_BASE_URL.replace(/\/$/, '')}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') target.searchParams.set(key, String(value));
  }

  return target.toString();
}

async function toError(response: Response): Promise<ApiError> {
  // The API returns problem details on validation failures; the message inside is written for a
  // person, so it is worth surfacing rather than replacing with a generic string.
  try {
    const body = await response.json();
    const message = body?.error ?? body?.message ?? body?.title ?? body?.detail;
    if (typeof message === 'string' && message) return new ApiError(response.status, message);
  } catch {
    /* Not JSON. Fall through to the status text. */
  }

  return new ApiError(response.status, response.statusText || `Request failed (${response.status})`);
}

/**
 * The in-flight refresh, shared by every caller that needs one.
 *
 * Refresh tokens rotate, and the server treats a replayed revoked token as a stolen one — it
 * revokes the whole chain rather than just refusing the request. Two requests that both hit a
 * 401 and both refresh would therefore sign the user out of everything. This page issues its
 * summary and claims requests in parallel, so that is a live path, not a hypothetical one.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // The refresh token is spent or revoked; there is no way back without signing in again.
        clearStoredAuth();
        return false;
      }

      const body = (await response.json()) as { token: string; refreshToken: string };
      setAccessToken(body.token);
      setRefreshToken(body.refreshToken);
      return true;
    } catch {
      // A network failure is not a rejected credential — keep the tokens and let the caller fail.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * A request with the current token, retried once if the token had simply expired.
 *
 * Retried only on 401. A 403 means the credential was understood and refused, and refreshing it
 * would produce exactly the same answer.
 */
async function authedFetch(target: string, signal?: AbortSignal): Promise<Response> {
  const send = () => fetch(target, { headers: { Authorization: `Bearer ${getAccessToken()}` }, signal });

  const response = await send();
  if (response.status !== 401) return response;

  return (await refreshAccessToken()) ? send() : response;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authedFetch(url(path, query), signal);

  if (!response.ok) throw await toError(response);

  return (await response.json()) as T;
}

/**
 * Downloads a file the API guards behind a bearer token.
 *
 * A plain link cannot carry an Authorization header, so the bytes are fetched and handed to a
 * temporary object URL. The alternative — a token in the query string — would put a credential
 * into browser history and server logs.
 */
export async function apiDownload(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<void> {
  const response = await authedFetch(url(path, query));

  if (!response.ok) throw await toError(response);

  const blob = await response.blob();
  const filename = filenameFrom(response) ?? path.split('/').pop() ?? 'download';

  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoking immediately can cancel the download in some browsers; a tick is enough.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

function filenameFrom(response: Response): string | null {
  const disposition = response.headers.get('content-disposition');
  if (!disposition) return null;

  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
}
