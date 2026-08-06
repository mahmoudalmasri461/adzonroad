import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import CreateCampaignDialog from '../CreateCampaignDialog';

type CreateCampaignContextValue = {
  openCreateCampaign: () => void;
};

const CreateCampaignContext = createContext<CreateCampaignContextValue | null>(null);

export function CreateCampaignProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openCreateCampaign: () => setOpen(true) }), []);

  return (
    <CreateCampaignContext.Provider value={value}>
      {children}
      <CreateCampaignDialog open={open} onClose={() => setOpen(false)} />
    </CreateCampaignContext.Provider>
  );
}

export function useCreateCampaign() {
  const ctx = useContext(CreateCampaignContext);
  if (!ctx) throw new Error('useCreateCampaign must be used within CreateCampaignProvider');
  return ctx;
}
