import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePortfolio } from './PortfolioContext';
import { deriveAlerts, type AdvertiserAlert } from '../../services/advertiserAlerts';
import { fetchInvoices, type Invoice } from '../../services/billing';

/**
 * The advertiser's alerts, derived once and read by the bell and the card alike.
 *
 * Both used to render a fixture list of five, which meant the badge said "5" to an account with
 * no campaigns. They now read the same derivation, so the number on the bell is always the number
 * of items in the list below it.
 *
 * Invoices are fetched here rather than in each consumer; the campaign and delivery half comes
 * from the surrounding portfolio load.
 */

export interface AlertsResult {
  alerts: AdvertiserAlert[];
  /** False until both halves have been attempted, so the bell shows no badge rather than a wrong one. */
  ready: boolean;
}

const AlertsCtx = createContext<AlertsResult | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const value = useDerivedAlerts();
  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>;
}

export function useAlerts(): AlertsResult {
  const shared = useContext(AlertsCtx);
  const own = useDerivedAlerts(shared === null);
  return shared ?? own;
}

function useDerivedAlerts(enabled = true): AlertsResult {
  const { portfolio, state } = usePortfolio();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    // An unreadable billing list is not worth an alert of its own; the campaign half still stands
    // on its own, so failure degrades to an empty invoice list rather than an empty page.
    fetchInvoices(controller.signal)
      .then((loaded) => { if (!controller.signal.aborted) setInvoices(loaded); })
      .catch(() => { if (!controller.signal.aborted) setInvoices([]); });

    return () => controller.abort();
  }, [enabled]);

  const settled = state !== 'loading' && invoices !== null;

  return {
    alerts: settled ? deriveAlerts(portfolio, invoices ?? []) : [],
    ready: settled,
  };
}
