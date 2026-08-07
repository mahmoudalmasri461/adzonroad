import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import ActionDialog from '../ActionDialog';
import AddCarDialog from './AddCarDialog';
import AddDriverDialog from './AddDriverDialog';
import { useToast } from '../../contexts/ToastProvider';
import { CARS, DRIVERS } from '../../data/taxiCompanyMockData';
import type { Car, CompanyDriver } from '../../types/taxiCompany';

type FleetContextValue = {
  cars: Car[];
  drivers: CompanyDriver[];
  openAddCar: () => void;
  openAddDriver: () => void;
  openDamageReport: (carId?: string) => void;
  openMaintenanceRequest: (carId?: string) => void;
};

const FleetContext = createContext<FleetContextValue | null>(null);

/**
 * Holds the company's fleet in one place so cars/drivers added on one page are
 * still there after navigating to another. Mounted once by TaxiCompanyLayout
 * (a react-router layout route), so it survives child-route changes.
 */
export function FleetProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [cars, setCars] = useState<Car[]>(CARS);
  const [drivers, setDrivers] = useState<CompanyDriver[]>(DRIVERS);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [damageVehicle, setDamageVehicle] = useState<string | undefined>(undefined);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<string | undefined>(undefined);

  const vehicleOptions = useMemo(
    () => cars.map((c) => ({ value: c.id, label: `${c.plateNumber} — ${c.model}` })),
    [cars],
  );

  const value = useMemo<FleetContextValue>(
    () => ({
      cars,
      drivers,
      openAddCar: () => setAddCarOpen(true),
      openAddDriver: () => setAddDriverOpen(true),
      openDamageReport: (carId?: string) => {
        setDamageVehicle(carId);
        setDamageOpen(true);
      },
      openMaintenanceRequest: (carId?: string) => {
        setMaintenanceVehicle(carId);
        setMaintenanceOpen(true);
      },
    }),
    [cars, drivers],
  );

  return (
    <FleetContext.Provider value={value}>
      {children}

      <AddCarDialog
        open={addCarOpen}
        onClose={() => setAddCarOpen(false)}
        onAdd={(car) => {
          setCars((prev) => [car, ...prev]);
          showToast(`${car.plateNumber} added to your fleet`);
        }}
      />
      <AddDriverDialog
        open={addDriverOpen}
        onClose={() => setAddDriverOpen(false)}
        onAdd={(driver) => {
          setDrivers((prev) => [driver, ...prev]);
          showToast(`${driver.name} added — pending document review`);
        }}
      />
      <ActionDialog
        open={damageOpen}
        onClose={() => setDamageOpen(false)}
        title="Report vehicle damage"
        placeholder="Describe the damage (e.g. cracked screen, dent, scratch)…"
        vehicleOptions={vehicleOptions}
        defaultVehicle={damageVehicle}
        onSubmitted={() => showToast('Damage report submitted')}
      />
      <ActionDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        title="Request maintenance"
        placeholder="What needs attention?"
        vehicleOptions={vehicleOptions}
        defaultVehicle={maintenanceVehicle}
        onSubmitted={() => showToast('Maintenance request submitted')}
      />
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}
