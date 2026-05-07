/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart2, Activity, Info, AlertCircle, RefreshCcw, ChevronRight, Share2 } from 'lucide-react';
import FileUpload from '@/src/components/FileUpload';
import ManualDataEntry from '@/src/components/ManualDataEntry';
import StatsGrid from '@/src/components/StatsGrid';
import DataCharts from '@/src/components/DataCharts';
import AdvancedAnalysis from '@/src/components/AdvancedAnalysis';
import { parseExcel, DataSeries } from '@/src/lib/data-utils';
import { cn } from '@/src/lib/utils';
import { LayoutGrid, Upload, Edit3 } from 'lucide-react';

export default function App() {
  const [series, setSeries] = useState<DataSeries[] | null>(null);
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<'upload' | 'manual'>('upload');

  const handleDataReady = async (parsedSeries: DataSeries[]) => {
    setLoading(true);
    setError(null);
    try {
      setSeries(parsedSeries);
      setActiveSeriesIndex(0);
    } catch (err: any) {
      setError(err.message || 'Failed to process data.');
      setSeries(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const parsedSeries = await parseExcel(file);
      await handleDataReady(parsedSeries);
    } catch (err: any) {
      setError(err.message || 'Failed to process file. Please ensure it is a valid Excel file.');
      setSeries(null);
      setLoading(false);
    }
  };

  const resetData = () => {
    setSeries(null);
    setError(null);
    setActiveSeriesIndex(0);
  };

  const activeSeries = series ? series[activeSeriesIndex] : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">StatStream</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Analytics Engine</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
            {series && (
              <button 
                onClick={resetData}
                className="text-blue-600 font-bold hover:text-blue-700 flex items-center space-x-1"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>New Analysis</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!series && !loading && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              <div className="max-w-3xl">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                  Insights derived from <span className="text-blue-600">raw data.</span>
                </h2>
                <p className="mt-4 text-xl text-gray-500 font-light">
                  Upload your Excel file or enter data manually to instantly compute statistics and visualize your data.
                </p>
              </div>

              <div className="flex flex-col space-y-8">
                <div className="flex items-center space-x-1 p-1 bg-gray-100/80 rounded-2xl w-fit backdrop-blur-sm self-center sm:self-start">
                  <button
                    onClick={() => setEntryMode('upload')}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                      entryMode === 'upload' 
                        ? "bg-white text-blue-600 shadow-md ring-1 ring-gray-100" 
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    <span>File Upload</span>
                  </button>
                  <button
                    onClick={() => setEntryMode('manual')}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                      entryMode === 'manual' 
                        ? "bg-white text-blue-600 shadow-md ring-1 ring-gray-100" 
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Manual Entry</span>
                  </button>
                </div>

                {entryMode === 'upload' ? (
                  <FileUpload onFileSelect={handleFileSelect} />
                ) : (
                  <ManualDataEntry onDataReady={handleDataReady} />
                )}
              </div>
              
              {error && (
                <div className="mt-6 flex items-center space-x-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 max-w-2xl mx-auto shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-50 grayscale">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Info className="w-6 h-6 text-gray-400" />
                  </div>
                  <h5 className="font-semibold text-gray-900 text-sm">Multi-column Analysis</h5>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-gray-400" />
                  </div>
                  <h5 className="font-semibold text-gray-900 text-sm">Dynamic Visualization</h5>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="relative">
                <RefreshCcw className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="mt-8 text-xl font-bold text-gray-900">Analyzing Dataset</h3>
              <p className="text-gray-500 mt-2">Computing indices and processing data...</p>
            </motion.div>
          )}

          {series && activeSeries && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Column Selector */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Statistical Analysis</h3>
                  <p className="text-xs text-gray-400 font-mono">Found {series.length} data columns</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {series.map((s, idx) => (
                    <button
                      key={s.columnName}
                      onClick={() => setActiveSeriesIndex(idx)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2",
                        activeSeriesIndex === idx 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      <span>{s.columnName}</span>
                      {activeSeriesIndex === idx && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <StatsGrid stats={activeSeries.stats} />
                <DataCharts series={activeSeries} />
              </div>

              <div className="pt-12 border-t border-gray-100">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Advanced Relationships</h3>
                </div>
                <AdvancedAnalysis allSeries={series} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">S</span>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">StatStream Engine</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Designed for professional data analysis.
          </p>
        </div>
      </footer>
    </div>
  );
}
