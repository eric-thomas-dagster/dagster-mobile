import React from 'react';
import { View, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '../ThemeProvider';

type Props = {
  inputJson: string;
};

// Parses the config payload from TOOL_TYPE_RENDER_DATA_VISUALIZATION and
// renders an actual chart. Supports bar + line. Falls back to null on
// parse failure — caller is responsible for showing a fallback state.
export const ChartBlock: React.FC<Props> = ({ inputJson }) => {
  const { theme } = useTheme();

  const parsed = React.useMemo(() => {
    try {
      return JSON.parse(inputJson);
    } catch {
      return null;
    }
  }, [inputJson]);

  if (!parsed?.config) return null;

  const config = parsed.config;
  const chartSpec = config.chart_specific_config || {};
  const chartType: string = chartSpec.chart_type || 'bar';
  const xValues: string[] = chartSpec.x_values || [];
  const series: { name: string; data: number[] }[] = chartSpec.series || [];

  if (!xValues.length || !series.length || !series[0]?.data?.length) return null;

  const screenWidth = Dimensions.get('window').width;
  // Give each x value ~70px min; scroll horizontally if it overflows.
  const chartWidth = Math.max(screenWidth - 40, xValues.length * 70);

  const labels = xValues.map((s) => (s.length > 14 ? s.slice(0, 12) + '…' : s));
  const data = {
    labels,
    datasets: series.map((s) => ({ data: s.data })),
    legend: series.map((s) => s.name),
  };

  const rnChartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      theme.dark
        ? `rgba(121,134,203,${opacity})`
        : `rgba(79,67,221,${opacity})`,
    labelColor: (_opacity = 1) => theme.colors.onSurface,
    barPercentage: 0.6,
    propsForBackgroundLines: {
      stroke: theme.colors.outline,
      strokeWidth: 0.5,
    },
    propsForLabels: { fontSize: 10 },
  };

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart
          data={data}
          width={chartWidth}
          height={260}
          chartConfig={rnChartConfig}
          fromZero
          bezier
          yAxisLabel=""
          yAxisSuffix=""
        />
      );
    }
    return (
      <BarChart
        data={data}
        width={chartWidth}
        height={260}
        chartConfig={rnChartConfig}
        fromZero
        yAxisLabel=""
        yAxisSuffix=""
        verticalLabelRotation={45}
        showValuesOnTopOfBars={false}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
      ]}
    >
      {config.title && (
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{config.title}</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {renderChart()}
      </ScrollView>
      {(chartSpec.x_label || chartSpec.y_label) && (
        <Text style={[styles.axis, { color: theme.colors.onSurfaceVariant }]}>
          {chartSpec.x_label ? `x: ${chartSpec.x_label}` : ''}
          {chartSpec.x_label && chartSpec.y_label ? '  ·  ' : ''}
          {chartSpec.y_label ? `y: ${chartSpec.y_label}` : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
  },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  axis: { fontSize: 11, marginTop: 4 },
});
