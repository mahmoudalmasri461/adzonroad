import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type IRetryPolicy,
} from '@microsoft/signalr';

/**
 * The dashboard's live feed.
 *
 * Wraps the SignalR hub at `/hubs/live`. Group membership is decided server-side from the JWT on
 * connect, so there is nothing to subscribe to here and no way to ask for another tenant's traffic
 * — this client only listens.
 */

/** Mirrors `VehicleLocationUpdate`. SignalR serialises records camelCase. */
export interface VehicleMovedEvent {
  vehicleId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  bearingDegrees: number | null;
  accuracyMeters: number;
  capturedAtUtc: string;
  receivedAtUtc: string;
  connectivity: 'Healthy' | 'Delayed' | 'Offline' | 'Unknown';
  canPresentAsLive: boolean;
}

/** Mirrors `VehicleConnectivityUpdate`. */
export interface VehicleConnectivityEvent {
  vehicleId: string | null;
  driverId: string;
  connectivity: 'Healthy' | 'Delayed' | 'Offline' | 'Unknown';
  gpsFreshness: string;
  lastHeartbeatAtUtc: string | null;
  lastFixCapturedAtUtc: string | null;
  pendingTelemetryCount: number;
}

/** Mirrors `TelemetryReconciledUpdate`. */
export interface TelemetryReconciledEvent {
  shiftId: string;
  vehicleId: string | null;
  claimsReconciled: number;
  nowVerified: number;
  atUtc: string;
}

export interface LiveConnectionHandlers {
  onVehicleMoved?: (e: VehicleMovedEvent) => void;
  onConnectivityChanged?: (e: VehicleConnectivityEvent) => void;
  onTelemetryReconciled?: (e: TelemetryReconciledEvent) => void;
  onStateChanged?: (state: LiveConnectionState) => void;
}

/**
 * The dashboard's own link to the server — not the vehicles'. Kept separate because the two are
 * routinely confused: a dropped browser socket says nothing about whether taxis are reporting, and
 * showing "offline" over the whole map because a laptop lost wifi would be wrong.
 */
export type LiveConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface LiveConnectionOptions {
  /** Base API origin, e.g. `http://localhost:5080`. */
  baseUrl: string;
  /** Called before every connect and reconnect, so a refreshed token is picked up. */
  accessTokenFactory: () => string | Promise<string>;
}

/**
 * Reconnect delays that escalate to thirty seconds and then keep trying, rather than exhausting.
 * A dashboard on a wall has no one to press reload.
 */
const FOREVER: IRetryPolicy = {
  nextRetryDelayInMilliseconds(context) {
    const schedule = [0, 2000, 5000, 10_000, 30_000];
    return schedule[Math.min(context.previousRetryCount, schedule.length - 1)];
  },
};

export function createLiveConnection(
  options: LiveConnectionOptions,
  handlers: LiveConnectionHandlers,
): { start: () => Promise<void>; stop: () => Promise<void>; connection: HubConnection } {
  const connection = new HubConnectionBuilder()
    .withUrl(`${options.baseUrl.replace(/\/$/, '')}/hubs/live`, {
      accessTokenFactory: options.accessTokenFactory,
    })
    // Never gives up. The array form of withAutomaticReconnect stops after its last delay, which
    // means a deployment lasting longer than the sequence leaves every open dashboard silently
    // dead — connected-looking, receiving nothing, with no error for anyone to notice.
    .withAutomaticReconnect(FOREVER)
    .configureLogging(LogLevel.Warning)
    .build();

  const report = (state: LiveConnectionState) => handlers.onStateChanged?.(state);

  if (handlers.onVehicleMoved)
    connection.on('vehicleMoved', handlers.onVehicleMoved);
  if (handlers.onConnectivityChanged)
    connection.on('vehicleConnectivityChanged', handlers.onConnectivityChanged);
  if (handlers.onTelemetryReconciled)
    connection.on('telemetryReconciled', handlers.onTelemetryReconciled);

  connection.onreconnecting(() => report('reconnecting'));
  connection.onreconnected(() => report('connected'));
  connection.onclose(() => report('disconnected'));

  return {
    connection,

    async start() {
      if (connection.state !== HubConnectionState.Disconnected) return;

      report('connecting');
      try {
        await connection.start();
        report('connected');
      } catch {
        // Automatic reconnect does not cover the *initial* connect, so a dashboard opened while the
        // API is down would otherwise stay dead until reloaded. The caller retries.
        report('disconnected');
        throw new Error('Live feed unavailable');
      }
    },

    async stop() {
      await connection.stop();
    },
  };
}
