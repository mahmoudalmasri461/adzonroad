---
name: analytics
description: Use this skill whenever adding or modifying charts, analytics views, or reporting visuals — especially anything using @mui/x-charts, which has a composition-based API in the installed version that differs from common MUI chart docs/examples.
---

# AdzOnRoad Analytics Skill

## The one component to reuse: AnalyticsChart

[src/components/advertiser/AnalyticsChart.tsx](../../../src/components/advertiser/AnalyticsChart.tsx) is a single wrapper covering all four chart types used in the advertiser portal (`variant: 'line' | 'bar' | 'area' | 'donut'`) over `@mui/x-charts`. When a task needs a new chart in the advertiser portal, extend this component's props/variants rather than hand-rolling a new `ChartsDataProvider` composition elsewhere — see `AdvertiserDashboard.tsx`'s Analytics section for the four real call sites (verified plays by day = line, impressions by region = bar, exposure by time of day = area, screen status distribution = donut).

Admin and Driver dashboards don't use `AnalyticsChart` (it lives under `components/advertiser/` and pulls in `advTokens` — see [design-system skill](../design-system/SKILL.md)); `AdvertiserDashboard.tsx`'s **old** pre-rebuild version used raw `ChartsDataProvider`/`ChartsSurface` composition inline (still the reference pattern if a non-advertiser page needs a chart before a shared non-scoped chart component exists).

## @mui/x-charts v9 composition — no all-in-one components used here

This project deliberately composes charts from primitives instead of using `<BarChart>`/`<LineChart>`/`<PieChart>` all-in-one components, matching the pattern already proven in the original `AdvertiserDashboard.tsx` build:

```
ChartsDataProvider (series=[...], xAxis=[...], height)
  ChartsSurface
    BarPlot | LinePlot+MarkPlot | AreaPlot+LinePlot+MarkPlot | PiePlot
    ChartsXAxis / ChartsYAxis   (cartesian only)
    ChartsTooltip
    ChartsLegend                (donut only, in this codebase)
```

Verified working imports (confirmed against the actually-installed package, not assumed from docs):
```ts
import { ChartsDataProvider } from '@mui/x-charts/ChartsDataProvider';
import { ChartsSurface } from '@mui/x-charts/ChartsSurface';
import { BarPlot } from '@mui/x-charts/BarChart';
import { LinePlot, MarkPlot, AreaPlot } from '@mui/x-charts/LineChart';
import { PiePlot } from '@mui/x-charts/PieChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
```

Gotchas hit while building this (check `node_modules/@mui/x-charts/<Family>/index.d.ts` before trusting any online example, since chart libraries change composition APIs frequently across majors):
- Area charts: pass `area: true` on a `type: 'line'` series and render `AreaPlot` alongside `LinePlot`/`MarkPlot` — there's no separate `type: 'area'` series kind.
- Donut/pie: series `type: 'pie'`, with `data: [{ id, value, label, color }]`, `innerRadius`/`outerRadius`/`paddingAngle`/`cornerRadius` on the series object itself (not on `PiePlot` props). Pie doesn't use `xAxis`/`ChartsXAxis`/`ChartsYAxis` at all.
- `ChartsLegend` in this installed version has **no `position` prop** — only `direction`, `onItemClick`, `toggleVisibilityOnClick`, `sx`, `classes`. Passing `position` is a TS compile error, not a silent no-op.
- Multi-axis combo charts (bar + line sharing different y-scales) need `yAxis={[{ id: 'a' }, { id: 'b' }]}` and each series tagged with `yAxisId` — see the pre-rebuild `AdvertiserDashboard.tsx` git history / the "Verified advertising hours & spend" chart pattern if resurrecting a dual-axis combo view.

## No charting library other than @mui/x-charts is installed

Don't reach for recharts/chart.js/victory/etc. — only `@mui/x-charts` (`^9.10.1`) is in `package.json`.
