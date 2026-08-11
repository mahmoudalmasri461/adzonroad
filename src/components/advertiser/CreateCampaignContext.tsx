import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import CreateCampaignDialog from '../CreateCampaignDialog';

type CreateCampaignContextValue = {
  openCreateCampaign: () => void;
  /**
   * Bumped when a campaign is submitted. A list can watch it to refetch, without the dialog
   * needing to know which lists exist.
   */
  createdCount: number;
};

const CreateCampaignContext = createContext<CreateCampaignContextValue | null>(null);

export function CreateCampaignProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const openCreateCampaign = useCallback(() => setOpen(true), []);
  const value = useMemo(
    () => ({ openCreateCampaign, createdCount }),
    [openCreateCampaign, createdCount],
  );

  return (
    <CreateCampaignContext.Provider value={value}>
      {children}
      <CreateCampaignDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => setCreatedCount((n) => n + 1)}
      />
    </CreateCampaignContext.Provider>
  );
}

export function useCreateCampaign() {
  const ctx = useContext(CreateCampaignContext);
  if (!ctx) throw new Error('useCreateCampaign must be used within CreateCampaignProvider');
  return ctx;
}
