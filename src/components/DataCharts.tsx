import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { DataSeries } from '@/src/lib/data-utils';
import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Box } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DataChartsProps {
  series: DataSeries;
}

export default function DataCharts({ series }: DataChartsProps) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'box' | 'histogram'>('area');
  const { data, stats } = series;

  const chartData = useMemo(() => {
    if (stats.type === 'numerical' && chartType === 'box') {
      return [{
        name: series.columnName,
        min: stats.min,
        q1: stats.q1,
        median: stats.median,
        q3: stats.q3,
        max: stats.max,
        // For stacked bar representation of BoxPlot
        bottom: stats.min,
        h1: stats.q1 - stats.min,
        h2: stats.median - stats.q1,
        h3: stats.q3 - stats.median,
        h4: stats.max - stats.q3
      }];
    }

    if (stats.type === 'numerical' && chartType === 'histogram') {
      const values = data.map(d => d.value);
      if (values.length === 0) return [];
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 15;
      const binWidth = (max - min) / binCount;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        rangeStart: min + i * binWidth,
        rangeEnd: min + (i + 1) * binWidth,
        count: 0,
        label: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`
      }));

      values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
        if (binIndex >= 0) bins[binIndex].count++;
      });

      return bins;
    }

    if (stats.type === 'numerical') {
      return data.slice(0, 100);
    } else {
      return stats.frequencies;
    }
  }, [series, stats, chartType, data]);

  // If categorical, we ignore the chart type toggle and just show frequency
  const isCategorical = stats.type === 'categorical';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-8"
      id="data-visualization"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {isCategorical ? "Category Distribution" : (chartType === 'box' ? "Box & Whisker Plot" : "Data Distribution")}
          </h3>
          <p className="text-sm text-gray-500">
            {isCategorical ? "Top unique values by frequency" : (chartType === 'box' ? "Visualizing quartiles and dispersion" : "Visualizing numerical trends across dataset")}
          </p>
        </div>

        {!isCategorical && (
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setChartType('area')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                chartType === 'area' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trend</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                chartType === 'bar' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Bars</span>
            </button>
            <button
              onClick={() => setChartType('box')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                chartType === 'box' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Box className="w-4 h-4" />
              <span>Box</span>
            </button>
            <button
              onClick={() => setChartType('histogram')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                chartType === 'histogram' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Freq</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'histogram' && !isCategorical ? (
             <BarChart data={chartData as any[]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
             </BarChart>
          ) : chartType === 'box' && !isCategorical ? (
             <BarChart data={chartData as any[]} margin={{ top: 20, right: 100, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                   cursor={false}
                   content={({ active, payload }) => {
                     if (active && payload && payload.length) {
                       const d = payload[0].payload;
                       return (
                         <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 text-[10px] space-y-1">
                           <p className="font-bold text-gray-900 mb-2">{d.name}</p>
                           <div className="space-y-1 font-mono">
                             <div className="flex justify-between gap-8"><span>Max:</span> <span className="font-bold">{d.max.toFixed(2)}</span></div>
                             <div className="flex justify-between gap-8 text-blue-600"><span>Q3:</span> <span className="font-bold">{d.q3.toFixed(2)}</span></div>
                             <div className="flex justify-between gap-8 font-bold text-gray-900 text-sm py-1 border-y border-gray-100"><span>Median:</span> <span>{d.median.toFixed(2)}</span></div>
                             <div className="flex justify-between gap-8 text-blue-600"><span>Q1:</span> <span className="font-bold">{d.q1.toFixed(2)}</span></div>
                             <div className="flex justify-between gap-8"><span>Min:</span> <span className="font-bold">{d.min.toFixed(2)}</span></div>
                           </div>
                         </div>
                       );
                     }
                     return null;
                   }}
                />
                <Bar dataKey="h1" stackId="a" fill="#F3F4F6" radius={0} />
                <Bar dataKey="h2" stackId="a" fill="#3B82F6" opacity={0.5} stroke="#2563EB" strokeWidth={1} />
                <Bar dataKey="h3" stackId="a" fill="#3B82F6" opacity={0.7} stroke="#2563EB" strokeWidth={1} />
                <Bar dataKey="h4" stackId="a" fill="#F3F4F6" radius={0} />
             </BarChart>
          ) : (chartType === 'bar' || isCategorical ? (
            <BarChart data={chartData as any[]} layout={isCategorical ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                type={isCategorical ? "number" : "category"}
                dataKey={isCategorical ? undefined : "label"} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                type={isCategorical ? "category" : "number"}
                dataKey={isCategorical ? "label" : undefined}
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#9CA3AF' }}
                width={isCategorical ? 100 : 40}
              />
              <Tooltip 
                 contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" radius={isCategorical ? [0, 6, 6, 0] : [6, 6, 0, 0]} animationDuration={1500}>
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3B82F6" opacity={0.6 + (index / chartData.length) * 0.4} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={chartData as any[]}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="label" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#9CA3AF' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
              />
            </AreaChart>
          ))}
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-500 font-medium">Dataset Values</span>
        </div>
        {!isCategorical && data.length > 100 && (
          <p className="text-[10px] text-gray-400 font-mono italic">
            * Displaying first 100 data points for optimal clarity
          </p>
        )}
      </div>
    </motion.div>
  );
}
