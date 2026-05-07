import { motion } from 'motion/react';
import { Sigma, ArrowUpDown, Hash, Minimize2, Maximize2, AlertTriangle, CheckCircle2, Type, Layers, Globe, TextCursorInput } from 'lucide-react';
import { Stats } from '@/src/lib/data-utils';
import { cn } from '@/src/lib/utils';

interface StatsGridProps {
  stats: Stats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const items = stats.type === 'numerical' ? [
    { 
      label: 'Mean', 
      value: stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      icon: Sigma, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'The average value'
    },
    { 
      label: 'Median', 
      value: stats.median.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      icon: ArrowUpDown, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      description: 'The middle value'
    },
    { 
      label: 'Mode', 
      value: stats.mode.length > 5 ? 'Multiple' : (stats.mode.length > 0 ? stats.mode.join(', ') : 'None'), 
      icon: Hash, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      description: 'Most frequent values'
    },
    { 
      label: 'Std. Deviation', 
      value: stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      icon: Sigma, 
      color: 'text-gray-600', 
      bg: 'bg-gray-100',
      description: 'Typical distance from mean'
    },
    { 
      label: 'Kurtosis', 
      value: stats.kurtosis.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      icon: Layers, 
      color: Math.abs(stats.kurtosis) > 1 ? 'text-amber-600' : 'text-gray-600', 
      bg: 'bg-gray-50',
      description: 'Peakedness of distribution'
    },
    { 
      label: 'Coeff. Variation', 
      value: stats.coefficientOfVariation.toFixed(1) + '%', 
      icon: Globe, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      description: 'Relative variability'
    },
    { 
      label: 'IQR', 
      value: stats.iqr.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      icon: ArrowUpDown, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      description: 'Prevalence of middle 50%'
    },
    { 
      label: 'Variance', 
      value: stats.variance.toLocaleString(undefined, { maximumFractionDigits: 1 }), 
      icon: Layers, 
      color: 'text-gray-600', 
      bg: 'bg-gray-100',
      description: 'Spread of data points'
    },
    { 
      label: '95% Conf. Interval', 
      value: `[${stats.confidenceInterval[0].toFixed(1)}, ${stats.confidenceInterval[1].toFixed(1)}]`, 
      icon: ArrowUpDown, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'Estimated mean range'
    },
    { 
      label: 'Sample Size', 
      value: stats.count.toString(), 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Valid rows analyzed'
    },
    { 
      label: 'Skewness', 
      value: stats.isSkewed ? (stats.skewDirection === 'right' ? 'Right' : 'Left') : 'Symmetric', 
      icon: stats.isSkewed ? AlertTriangle : CheckCircle2, 
      color: stats.isSkewed ? 'text-amber-600' : 'text-emerald-600', 
      bg: stats.isSkewed ? 'bg-amber-50' : 'bg-emerald-50',
      description: stats.isSkewed 
        ? `Leans towards ${stats.skewDirection} (Outliers detected)` 
        : 'Balanced distribution'
    },
    { 
      label: 'Minimum', 
      value: stats.min.toLocaleString(), 
      icon: Minimize2, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      description: 'Lowest data point'
    },
    { 
      label: 'Maximum', 
      value: stats.max.toLocaleString(), 
      icon: Maximize2, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      description: 'Highest data point'
    },
  ] : [
    { 
      label: 'Top Category', 
      value: stats.topCategory || 'N/A', 
      icon: Type, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: `Occurs ${stats.topCategoryFrequency} times`
    },
    { 
      label: 'Cardinality', 
      value: stats.uniqueCount.toString(), 
      icon: Layers, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      description: 'Total unique values'
    },
    { 
      label: 'Mode', 
      value: stats.mode.length > 3 ? `${stats.mode.length} Values` : (stats.mode.length > 0 ? stats.mode.join(', ') : 'None'), 
      icon: Hash, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      description: 'Most frequent string'
    },
    { 
      label: 'Density', 
      value: ((stats.topCategoryFrequency / stats.count) * 100).toFixed(1) + '%', 
      icon: Globe, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Percentage of top category'
    },
    { 
      label: 'Avg Length', 
      value: stats.avgLength.toFixed(1), 
      icon: TextCursorInput, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      description: 'Characters per entry'
    },
    { 
      label: 'Total Entries', 
      value: stats.count.toString(), 
      icon: CheckCircle2, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      description: 'Non-empty rows processed'
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          variants={itemAnim}
          id={`stat-card-${idx}`}
          className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <h4 className="text-3xl font-bold stat-value text-gray-900 leading-tight">
                {item.value}
              </h4>
            </div>
            <div className={cn("p-2 rounded-xl", item.bg)}>
              <item.icon className={cn("w-6 h-6", item.color)} />
            </div>
          </div>
          {item.label === '95% Conf. Interval' && stats.type === 'numerical' && (
            <div className="mt-4 h-6 w-full relative flex items-center">
              <div className="h-0.5 w-full bg-gray-100 rounded-full" />
              <div 
                className="absolute h-0.5 bg-blue-500 rounded-full"
                style={{
                  left: `${Math.max(0, (stats.confidenceInterval[0] - stats.min) / (stats.max - stats.min) * 100)}%`,
                  right: `${100 - Math.min(100, (stats.confidenceInterval[1] - stats.min) / (stats.max - stats.min) * 100)}%`
                }}
              />
              <div 
                 className="absolute w-2 h-2 bg-blue-600 rounded-full shadow-sm"
                 style={{ left: `${(stats.mean - stats.min) / (stats.max - stats.min) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4 border-t border-gray-50 pt-3 italic space-y-2">
            <span>{item.description}</span>
          </p>

        </motion.div>
      ))}
    </motion.div>
  );
}
