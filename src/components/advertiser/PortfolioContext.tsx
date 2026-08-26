import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCreateCampaign } from './CreateCampaignContext';
import { loadPortfolio, type PortfolioDelivery } from '../../services/advertiserAnalytics';

/**
 * One portfolio fetch, shared by every card on the page.
 *
 * Loading a portfolio is a fan-out: one campaign list plus one delivery report per campaign. Five
 * cards each calling it independently would multiply that by five and — worse — put a total from
 * one round of requests beside a breakdown from another, so the headline and the rows underneath
 * it could disagree about the same period.
 *
 * Consumers that can appear outside a provider fall back to loading their own copy, so a card
 * dropped onto a page on its own still works rather than rendering blank.
 *
 * The load repeats when a campaign is submitted, so a newly created campaign appears in every
 * card at once instead of only in whichever one happened to refetch.
 */

export type PortfolioState = 'loading' | 'ready' | 'error';

export interface PortfolioResult {
  portfolio: PortfolioDelivery | null;
  state: PortfolioState;
  days: number;
}

const PortfolioCtx = createContext<PortfolioResult | null>(null);

export function PortfolioProvider({ days = 30, children }: { days?: number; children: ReactNode }) {
  const value = useLoadedPortfolio(days);
  return <PortfolioCtx.Provider value={value}>{children}</PortfolioCtx.Provider>;
}

/**
 * The portfolio for the surrounding page, or a private one if there is no provider.
 *
 * The hook is called unconditionally either way — the fetch inside it is what is skipped when a
 * provider is present, not the hook itself.
 */
export function usePortfolio(days = 30): PortfolioResult {
  const shared = useContext(PortfolioCtx);
  const own = useLoadedPortfolio(days, shared === null);
  return shared ?? own;
}

function useLoadedPortfolio(days: number, enabled = true): PortfolioResult {
  const { createdCount } = useCreateCampaign();
  const [portfolio, setPortfolio] = useState<PortfolioDelivery | null>(null);
  const [state, setState] = useState<PortfolioState>('loading');

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    loadPortfolio(days, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setPortfolio(loaded);
        setState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });

    return () => controller.abort();
  }, [days, enabled, createdCount]);

  return { portfolio, state, days };
}
