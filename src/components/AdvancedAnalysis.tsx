import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  Line, 
  ComposedChart,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { DataSeries, calculateCorrelations, calculateRegression, performTTest } from '@/src/lib/data-utils';
import { cn } from '@/src/lib/utils';
import { GitCompare, LineChart as LucideLineChart, Microscope, Info, TrendingUp, AlertCircle } from 'lucide-react';

interface AdvancedAnalysisProps {
  allSeries: DataSeries[];
}

export default function AdvancedAnalysis({ allSeries }: AdvancedAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'correlation' | 'regression' | 'hypothesis'>('correlation');
  
  const numericalSeries = useMemo(() => 
    allSeries.filter(s => s.stats.type === 'numerical'), 
  [allSeries]);

  const correlations = useMemo(() => 
    calculateCorrelations(allSeries), 
  [allSeries]);

  const [regXIndex, setRegXIndex] = useState(0);
  const [regYIndex, setRegYIndex] = useState(1);
  const [alpha, setAlpha] = useState(0.05);

  const regressionData = useMemo(() => {
    if (numericalSeries.length < 2) return null;
    const s1 = numericalSeries[regXIndex % numericalSeries.length];
    const s2 = numericalSeries[regYIndex % numericalSeries.length];
    
    const x = s1.data.map(d => d.value);
    const y = s2.data.map(d => d.value);
    const minLen = Math.min(x.length, y.length);
    
    const points = [];
    for (let i = 0; i < minLen; i++) {
        points.push({ x: x[i], y: y[i], label: s1.data[i].label });
    }
    
    const regression = calculateRegression(x, y);
    
    // Line points
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const lineData = [
        { x: minX, regression: regression.slope * minX + regression.intercept },
        { x: maxX, regression: regression.slope * maxX + regression.intercept }
    ];

    return { points, lineData, regression, colA: s1.columnName, colB: s2.columnName };
  }, [numericalSeries, regXIndex, regYIndex]);

  const hypothesisResult = useMemo(() => {
    if (numericalSeries.length < 2) return null;
    const s1 = numericalSeries[regXIndex % numericalSeries.length];
    const s2 = numericalSeries[regYIndex % numericalSeries.length];
    return {
        ...performTTest(s1.stats as any, s2.stats as any),
        nameA: s1.columnName,
        nameB: s2.columnName,
        alpha
    };
  }, [numericalSeries, regXIndex, regYIndex, alpha]);

  const tTestChartData = useMemo(() => {
    if (!hypothesisResult || numericalSeries.length < 2) return [];
    const s1 = numericalSeries[regXIndex % numericalSeries.length];
    const s2 = numericalSeries[regYIndex % numericalSeries.length];
    
    const stats1 = s1.stats as any;
    const stats2 = s2.stats as any;
    
    return [
        { 
            name: s1.columnName, 
            mean: stats1.mean, 
            error: [stats1.confidenceInterval[0], stats1.confidenceInterval[1]],
            color: '#3B82F6'
        },
        { 
            name: s2.columnName, 
            mean: stats2.mean, 
            error: [stats2.confidenceInterval[0], stats2.confidenceInterval[1]],
            color: '#8B5CF6'
        }
    ];
  }, [hypothesisResult, numericalSeries, regXIndex, regYIndex]);

  if (numericalSeries.length < 2) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border-amber-100 bg-amber-50/30">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900">Insufficient Data for Advanced Analysis</h3>
        <p className="text-sm text-gray-500 mt-1">Multi-column analysis (Correlation/Regression) requires at least two numerical columns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="advanced-analysis">
      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('correlation')}
          className={cn(
            "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'correlation' ? "bg-white text-blue-600 shadow-lg shadow-blue-50" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <GitCompare className="w-4 h-4" />
          <span>Correlation</span>
        </button>
        <button
          onClick={() => setActiveTab('regression')}
          className={cn(
            "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'regression' ? "bg-white text-blue-600 shadow-lg shadow-blue-50" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <LucideLineChart className="w-4 h-4" />
          <span>Scatter & Regression</span>
        </button>
        <button
          onClick={() => setActiveTab('hypothesis')}
          className={cn(
            "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'hypothesis' ? "bg-white text-blue-600 shadow-lg shadow-blue-50" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Microscope className="w-4 h-4" />
          <span>T-Test</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'correlation' && (
          <motion.div
            key="correlation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Correlation Matrix</h3>
              <div className="space-y-4">
                {correlations.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter">Pair</p>
                      <p className="text-sm font-semibold text-gray-900">{c.colA} & {c.colB}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-gray-900">{c.coefficient.toFixed(3)}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase",
                        Math.abs(c.coefficient) > 0.7 ? "text-green-600" : Math.abs(c.coefficient) > 0.3 ? "text-amber-600" : "text-gray-400"
                      )}>
                        {Math.abs(c.coefficient) > 0.7 ? "Strong" : Math.abs(c.coefficient) > 0.3 ? "Moderate" : "Weak"} {c.coefficient > 0 ? "Positive" : "Negative"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between uppercase font-bold tracking-widest">
                  <span>-1.0 Perfect Inverse</span>
                  <span>0.0 Neutral</span>
                  <span>1.0 Perfect Positive</span>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-8 flex flex-col justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Info className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pearson Correlation</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Measures the linear dependence between two variables. A value of <strong>+1</strong> implies a perfect positive correlation, while <strong>-1</strong> implies a perfect negative correlation. Values near <strong>0</strong> indicate no linear relationship.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'regression' && regressionData && (
          <motion.div
            key="regression"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-wrap gap-4 items-center justify-between p-6 glass-card rounded-2xl">
                <div className="flex items-center space-x-6">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Independent (X)</label>
                        <select 
                            value={regXIndex} 
                            onChange={(e) => setRegXIndex(Number(e.target.value))}
                            className="block w-full bg-white border-0 focus:ring-0 text-sm font-bold text-gray-900"
                        >
                            {numericalSeries.map((s, i) => <option key={i} value={i}>{s.columnName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Dependent (Y)</label>
                        <select 
                            value={regYIndex} 
                            onChange={(e) => setRegYIndex(Number(e.target.value))}
                            className="block w-full bg-white border-0 focus:ring-0 text-sm font-bold text-gray-900"
                        >
                            {numericalSeries.map((s, i) => <option key={i} value={i}>{s.columnName}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-12">
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">R-Squared</p>
                        <p className="text-2xl font-mono font-bold text-blue-600">{regressionData.regression.r2.toFixed(3)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Slope</p>
                        <p className="text-2xl font-mono font-bold text-gray-900">{regressionData.regression.slope.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-2xl p-8">
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={regressionData.points}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis type="number" dataKey="x" name={regressionData.colA} fontSize={10} tickLine={false} axisLine={false}  />
                        <YAxis type="number" dataKey="y" name={regressionData.colB} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                             cursor={{ strokeDasharray: '3 3' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Scatter name="Data" data={regressionData.points} fill="#3B82F6" />
                        <Scatter 
                            name="Regression" 
                            data={regressionData.lineData} 
                            fill="transparent"
                            line={{ stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 italic text-sm text-blue-800">
                  <p className="font-bold mb-2 uppercase tracking-widest text-[10px]">Model Interpretation</p>
                  The linear model predicts that for every 1 unit increase in <strong>{regressionData.colA}</strong>, 
                  <strong> {regressionData.colB}</strong> changes by <strong>{regressionData.regression.slope.toFixed(2)}</strong> units.
                  With an R-squared of <strong>{regressionData.regression.r2.toFixed(3)}</strong>, 
                  this model explains <strong>{(regressionData.regression.r2 * 100).toFixed(1)}%</strong> of the variance in the target variable.
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'hypothesis' && hypothesisResult && (
          <motion.div
            key="hypothesis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 py-4"
          >
            <div className="flex flex-wrap gap-6 items-center justify-between p-6 glass-card rounded-2xl">
                <div className="flex items-center space-x-6">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Sample A (Independent)</label>
                        <select 
                            value={regXIndex} 
                            onChange={(e) => setRegXIndex(Number(e.target.value))}
                            className="block w-full bg-white border-0 focus:ring-0 text-sm font-bold text-gray-900"
                        >
                            {numericalSeries.map((s, i) => <option key={i} value={i}>{s.columnName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Sample B (Comparison)</label>
                        <select 
                            value={regYIndex} 
                            onChange={(e) => setRegYIndex(Number(e.target.value))}
                            className="block w-full bg-white border-0 focus:ring-0 text-sm font-bold text-gray-900"
                        >
                            {numericalSeries.map((s, i) => <option key={i} value={i}>{s.columnName}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Significance Level (α)</label>
                    <div className="flex space-x-2">
                        {[0.1, 0.05, 0.01].map((val) => (
                            <button
                                key={val}
                                onClick={() => setAlpha(val)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                    alpha === val ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="text-center space-y-4 max-w-xl">
                   <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Microscope className="w-8 h-8 text-violet-600" />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900">Welch's T-Test Inference</h3>
                   <p className="text-gray-500 text-sm">Comparing means between <strong>{hypothesisResult.nameA}</strong> and <strong>{hypothesisResult.nameB}</strong></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                   <div className="text-center p-6 glass-card rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">T-Statistic</p>
                      <p className="text-2xl font-mono font-bold text-gray-900">{hypothesisResult.t.toFixed(4)}</p>
                   </div>
                   <div className="text-center p-6 glass-card rounded-2xl border-blue-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">P-Value</p>
                      <p className={cn(
                          "text-2xl font-mono font-bold",
                          hypothesisResult.p < alpha ? "text-green-600" : "text-amber-600"
                      )}>
                          {hypothesisResult.p.toFixed(5)}
                      </p>
                   </div>
                   <div className="text-center p-6 glass-card rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deg. of Freedom</p>
                      <p className="text-2xl font-mono font-bold text-gray-900">{hypothesisResult.df.toFixed(2)}</p>
                   </div>
              </div>

              <div className={cn(
                  "p-6 rounded-2xl w-full max-w-xl text-center border",
                  hypothesisResult.p < alpha 
                    ? "bg-green-50/50 border-green-100 text-green-700" 
                    : "bg-amber-50/50 border-amber-100 text-amber-700"
              )}>
                  <p className="text-sm font-bold mb-1">
                      {hypothesisResult.p < alpha 
                          ? `Statistically Significant (p < ${alpha})`
                          : `Not Statistically Significant (p ≥ ${alpha})`}
                  </p>
                    <p className="text-xs opacity-80">
                      {hypothesisResult.p < alpha 
                          ? "We reject the null hypothesis. There is strong evidence that the population means are significantly different."
                          : "We fail to reject the null hypothesis. There is not enough evidence to claim the means are significantly different."}
                  </p>
              </div>

              <div className="w-full max-w-xl h-64 glass-card rounded-2xl p-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Visual Comparison (95% CI)</p>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tTestChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="mean" radius={[6, 6, 0, 0]} barSize={40}>
                              {tTestChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
