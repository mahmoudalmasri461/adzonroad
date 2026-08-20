import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import ActionDialog from '../ActionDialog';
import AddCarDialog from './AddCarDialog';
import AddDriverDialog from './AddDriverDialog';
import { useToast } from '../../contexts/ToastProvider';
import {
  getFleetDrivers,
  getFleetProfile,
  getFleetSummary,
  getFleetVehicles,
  raiseFleetSupportTicket,
  registerFleetVehicle,
  addFleetDriver,
  type FleetDriver,
  type FleetProfile,
  type FleetSummary,
  type FleetVehicle,
} from '../../services/fleet';

type FleetContextValue = {
  profile: FleetProfile | null;
  summary: FleetSummary | null;
  vehicles: FleetVehicle[];
  drivers: FleetDriver[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  openAddCar: () => void;
  openAddDriver: () => void;
  openDamageReport: (vehicleId?: string) => void;
  openMaintenanceRequest: (vehicleId?: string) => void;
};

const FleetContext = createContext<FleetContextValue | null>(null);

/**
 * The company's own fleet, fetched once and shared across the portal's pages.
 *
 * Mounted by TaxiCompanyLayout (a react-router layout route), so it survives child-route changes
 * and a car registered on one page is present on the next.
 *
 * There is deliberately no fallback to sample data when a request fails. An earlier version of
 * this portal rendered a fixture fleet — six vehicles belonging to a company that does not exist —
 * which looked like working software and was the most misleading thing in the product. An error
 * message is worth more than a convincing lie.
 */
export function FleetProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<FleetProfile | null>(null);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [addCarOpen, setAddCarOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [damageVehicle, setDamageVehicle] = useState<string | undefined>(undefined);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<string | undefined>(undefined);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [profileResult, summaryResult, vehicleResult, driverResult] = await Promise.all([
          getFleetProfile(controller.signal),
          getFleetSummary(controller.signal),
          getFleetVehicles(controller.signal),
          getFleetDrivers(controller.signal),
        ]);

        setProfile(profileResult);
        setSummary(summaryResult);
        setVehicles(vehicleResult);
        setDrivers(driverResult);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load your fleet.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [reloadToken]);

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({
      value: v.id,
      label: v.model ? `${v.plateNumber} — ${v.model}` : v.plateNumber,
    })),
    [vehicles],
  );

  const value = useMemo<FleetContextValue>(
    () => ({
      profile,
      summary,
      vehicles,
      drivers,
      loading,
      error,
      reload,
      openAddCar: () => setAddCarOpen(true),
      openAddDriver: () => setAddDriverOpen(true),
      openDamageReport: (vehicleId?: string) => {
        setDamageVehicle(vehicleId);
        setDamageOpen(true);
      },
      openMaintenanceRequest: (vehicleId?: string) => {
        setMaintenanceVehicle(vehicleId);
        setMaintenanceOpen(true);
      },
    }),
    [profile, summary, vehicles, drivers, loading, error, reload],
  );

  return (
    <FleetContext.Provider value={value}>
      {children}

      <AddCarDialog
        open={addCarOpen}
        onClose={() => setAddCarOpen(false)}
        onAdd={async (input) => {
          const vehicle = await registerFleetVehicle(input);
          // Refetched rather than appended: the server decides the region, the derived status,
          // and whether a screen is fitted, and none of that is knowable from the form.
          reload();
          showToast(`${vehicle.plateNumber} added to your fleet`);
        }}
      />

      <AddDriverDialog
        open={addDriverOpen}
        onClose={() => setAddDriverOpen(false)}
        onAdd={async (input) => {
          const driver = await addFleetDriver(input);
          reload();
          showToast(`${driver.name} added — awaiting document review`);
        }}
      />

      <ActionDialog
        open={damageOpen}
        onClose={() => setDamageOpen(false)}
        title="Report vehicle damage"
        placeholder="Describe the damage (e.g. cracked screen, dent, scratch)…"
        vehicleOptions={vehicleOptions}
        defaultVehicle={damageVehicle}
        onSubmitted={async ({ note, vehicle }) => {
          await raiseFleetSupportTicket({ type: 'Damage', message: note, vehicleId: vehicle });
          showToast('Damage report submitted');
        }}
      />

      <ActionDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        title="Request maintenance"
        placeholder="What needs attention?"
        vehicleOptions={vehicleOptions}
        defaultVehicle={maintenanceVehicle}
        onSubmitted={async ({ note, vehicle }) => {
          await raiseFleetSupportTicket({ type: 'Maintenance', message: note, vehicleId: vehicle });
          showToast('Maintenance request submitted');
        }}
      />
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}
