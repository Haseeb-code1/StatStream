import { useState } from 'react';
import { motion } from 'motion/react';
import { Edit3, Play, FileText, Trash2, Clipboard } from 'lucide-react';
import { parseManualInput, DataSeries } from '@/src/lib/data-utils';
import { cn } from '@/src/lib/utils';

interface ManualDataEntryProps {
  onDataReady: (series: DataSeries[]) => void;
}

const SAMPLE_DATA = `Month,Revenue,Profit,Growth
Jan,4500,1200,5.2
Feb,5200,1500,8.1
Mar,4800,1100,-2.5
Apr,6100,2100,12.4
May,5900,1800,4.2
Jun,7200,2800,15.6`;

export default function ManualDataEntry({ onDataReady }: ManualDataEntryProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const series = parseManualInput(text);
    if (series.length > 0) {
      onDataReady(series);
    }
  };

  const handleSampleData = () => {
    setText(SAMPLE_DATA);
  };

  const handleClear = () => {
    setText('');
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      <div className={cn(
        "relative rounded-2xl transition-all duration-300 border-2",
        isFocused ? "border-blue-500 bg-white shadow-xl shadow-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"
      )}>
        <div className="absolute top-4 left-4 flex items-center space-x-2 text-gray-400">
           <Edit3 className="w-4 h-4" />
           <span className="text-[10px] uppercase font-bold tracking-widest">Manual Data Input</span>
        </div>

        <div className="absolute top-4 right-4 flex items-center space-x-2">
           <button 
             onClick={handleSampleData}
             className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-[10px] font-bold uppercase tracking-wider"
           >
             <FileText className="w-3 h-3" />
             <span>Try Sample</span>
           </button>
           <button 
             onClick={handleClear}
             className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
             title="Clear All"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Paste your data here (CSV, Tab-separated, or just a list of numbers)...

Example:
Header1, Header2
10, 20
15, 25
...`}
          className="w-full h-64 p-12 bg-transparent border-0 focus:ring-0 font-mono text-sm resize-none text-gray-700 placeholder:text-gray-300"
        />

        <div className="absolute bottom-4 right-4 animate-in slide-in-from-bottom-2">
            <button
               onClick={handleAnalyze}
               disabled={!text.trim()}
               className={cn(
                 "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg",
                 text.trim() 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
               )}
            >
               <Play className="w-4 h-4 fill-current" />
               <span>Analyze Data</span>
            </button>
        </div>
        
        {!text && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none group">
              <div className="text-center space-y-4">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                    <Clipboard className="w-8 h-8 text-gray-200" />
                 </div>
                 <p className="text-gray-300 text-sm font-medium">Paste from Excel, Google Sheets, or CSV</p>
              </div>
           </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-12 opacity-40 grayscale pointer-events-none">
          <div className="flex flex-col items-center">
             <span className="text-2xl font-bold text-gray-900 border-2 border-gray-900 rounded-lg px-2 mb-2">CSV</span>
             <span className="text-[8px] uppercase font-bold tracking-widest">Comma Separated</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-2xl font-bold text-gray-900 border-2 border-gray-900 rounded-lg px-2 mb-2">TSV</span>
             <span className="text-[8px] uppercase font-bold tracking-widest">Tab Separated</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-2xl font-bold text-gray-900 border-2 border-gray-900 rounded-lg px-2 mb-2">TXT</span>
             <span className="text-[8px] uppercase font-bold tracking-widest">Plain Text List</span>
          </div>
      </div>
    </motion.div>
  );
}
