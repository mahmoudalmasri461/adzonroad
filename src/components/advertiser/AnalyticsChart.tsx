import Box from '@mui/material/Box';
import { ChartsDataProvider } from '@mui/x-charts/ChartsDataProvider';
import { ChartsSurface } from '@mui/x-charts/ChartsSurface';
import { BarPlot } from '@mui/x-charts/BarChart';
import { LinePlot, MarkPlot, AreaPlot } from '@mui/x-charts/LineChart';
import { PiePlot } from '@mui/x-charts/PieChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { advTokens } from './theme';

type Series = { label: string; data: number[]; color?: string };

type CartesianProps = {
  variant: 'line' | 'bar' | 'area';
  categories: string[];
  series: Series[];
  height?: number;
};

type DonutSlice = { label: string; value: number; color: string };

type DonutProps = {
  variant: 'donut';
  data: DonutSlice[];
  height?: number;
};

type AnalyticsChartProps = CartesianProps | DonutProps;

export default function AnalyticsChart(props: AnalyticsChartProps) {
  const height = props.height ?? 240;

  if (props.variant === 'donut') {
    const pieData = props.data.map((d, i) => ({ id: i, value: d.value, label: d.label, color: d.color }));
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center' }}>
        <ChartsDataProvider series={[{ type: 'pie', data: pieData, innerRadius: 45, outerRadius: 92, paddingAngle: 2, cornerRadius: 3 }]} height={height} width={height + 120}>
          <ChartsSurface>
            <PiePlot />
            <ChartsTooltip />
            <ChartsLegend direction="vertical" sx={{ fontSize: 12 }} />
          </ChartsSurface>
        </ChartsDataProvider>
      </Box>
    );
  }

  const isBar = props.variant === 'bar';
  const isArea = props.variant === 'area';

  const series = props.series.map((s) => ({
    type: isBar ? ('bar' as const) : ('line' as const),
    data: s.data,
    label: s.label,
    color: s.color ?? advTokens.orange,
    area: isArea,
    ...(isArea ? { showMark: false } : {}),
  }));

  return (
    <Box sx={{ height }}>
      <ChartsDataProvider series={series} xAxis={[{ scaleType: 'band', data: props.categories, id: 'x' }]} height={height}>
        <ChartsSurface>
          {isBar && <BarPlot />}
          {isArea && <AreaPlot />}
          {!isBar && <LinePlot />}
          {!isBar && <MarkPlot />}
          <ChartsXAxis axisId="x" />
          <ChartsYAxis />
          <ChartsTooltip />
        </ChartsSurface>
      </ChartsDataProvider>
    </Box>
  );
}
