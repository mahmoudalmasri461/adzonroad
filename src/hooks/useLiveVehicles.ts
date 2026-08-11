import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, getAccessToken } from '../services/apiConfig';
import {
  createLiveConnection,
  type LiveConnectionState,
  type TelemetryReconciledEvent,
} from '../services/liveConnection';
import {
  applyConnectivity,
  applyFix,
  renderAll,
  type VehicleFeedStore,
} from '../services/vehicleFeedState';
import type { RenderedVehicle } from '../services/vehicleInterpolation';

/**
 * Live vehicle positions for the map.
 *
 * Two clocks run here, deliberately separated. Fixes arrive from the hub whenever they arrive —
 * every few seconds when all is well, in a burst after a tunnel, not at all when a device is off.
 * The render tick runs at a steady 4 Hz regardless, recomputing where each marker should be drawn
 * *now*. Positions between fixes are interpolated for smoothness and flagged as derived; when the
 * fixes stop the interpolator refuses to invent more, and the markers freeze rather than gliding on.
 *
 * The decisions themselves live in `vehicleFeedState`, which is pure and tested; this hook is the
 * wiring between a socket, a timer, and React.
 */

const RENDER_INTERVAL_MS = 250;
const RECONNECT_DELAY_MS = 5000;

export interface LiveVehiclesResult {
  vehicles: RenderedVehicle[];
  /** The browser's link to the server — not the vehicles' link. */
  connectionState: LiveConnectionState;
  /** Most recent late-evidence reconciliation, for the "synchronising" banner. */
  lastReconciliation: TelemetryReconciledEvent | null;
}

export function useLiveVehicles(enabled = true): LiveVehiclesResult {
  const [vehicles, setVehicles] = useState<RenderedVehicle[]>([]);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [lastReconciliation, setLastReconciliation] = useState<TelemetryReconciledEvent | null>(null);

  // Fixes land in a ref, not state. Across a fleet reporting every few seconds, setting state per
  // event would re-render the map far more often than anyone can perceive.
  const store = useRef<VehicleFeedStore>(new Map());

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let retryTimer: number | undefined;
    const feed = store.current;

    const live = createLiveConnection(
      { baseUrl: API_BASE_URL, accessTokenFactory: getAccessToken },
      {
        // Braces matter: these helpers return a boolean, and a hub handler that returns anything
        // makes SignalR try to send a result back for a message the server sent with no
        // invocation id — one logged error per fix, several a second across a fleet.
        onVehicleMoved: (e) => {
          applyFix(feed, e);
        },
        onConnectivityChanged: (e) => {
          applyConnectivity(feed, e);
        },
        onTelemetryReconciled: setLastReconciliation,
        onStateChanged: (state) => {
          setConnectionState(state);

          // The hub's own retry policy handles drops, but a connection that ends up fully closed
          // — a rejected token, a stop during negotiation — would otherwise stay closed forever.
          if (state === 'disconnected' && !disposed) {
            retryTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
          }
        },
      },
    );

    // Automatic reconnect covers dropped connections but not a failed *first* connect, which is
    // the common case when a dashboard is opened before the API is reachable.
    const connect = () => {
      live.start().catch(() => {
        /* onStateChanged('disconnected') has already scheduled the next attempt. */
      });
    };
    connect();

    const ticker = window.setInterval(
      () => setVehicles(renderAll(feed, Date.now())),
      RENDER_INTERVAL_MS,
    );

    return () => {
      disposed = true;
      window.clearInterval(ticker);
      if (retryTimer) window.clearTimeout(retryTimer);
      void live.stop();
    };
  }, [enabled]);

  return { vehicles, connectionState, lastReconciliation };
}
