import * as XLSX from 'xlsx';

export interface DataPoint {
  index: number;
  label: string;
  value: number;
  stringValue?: string;
}

export interface DataSeries {
  columnName: string;
  data: DataPoint[];
  stats: Stats;
}

export interface NumericalStats {
  type: 'numerical';
  mean: number;
  median: number;
  mode: number[];
  count: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  stdDev: number;
  variance: number;
  kurtosis: number;
  coefficientOfVariation: number;
  confidenceInterval: [number, number];
  isSkewed: boolean;
  skewDirection: 'left' | 'right' | 'none';
}

export interface CorrelationResult {
  colA: string;
  colB: string;
  coefficient: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

export interface CategoricalStats {
  type: 'categorical';
  count: number;
  uniqueCount: number;
  topCategory: string;
  topCategoryFrequency: number;
  frequencies: { label: string, value: number }[];
  mode: string[];
  avgLength: number;
}

export type Stats = NumericalStats | CategoricalStats;

export async function parseExcel(file: File): Promise<DataSeries[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 1) throw new Error('Excel file is empty');

        const headers = jsonData[0];
        const series: DataSeries[] = [];

        for (let c = 0; c < headers.length; c++) {
          const rawValues: any[] = [];
          
          for (let r = 1; r < jsonData.length; r++) {
            const val = jsonData[r][c];
            if (val !== undefined && val !== null && val !== '') {
              rawValues.push(val);
            }
          }

            if (rawValues.length > 0) {
              series.push(createDataSeries(headers[c]?.toString() || `Column ${c + 1}`, rawValues));
            }
          }

          if (series.length === 0) {
            throw new Error('No valid data columns found in the dataset.');
          }

          resolve(series);
        } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function calculateStats(values: number[]): NumericalStats {
  if (values.length === 0) {
    return { 
      type: 'numerical', 
      mean: 0, 
      median: 0, 
      mode: [], 
      count: 0, 
      min: 0, 
      max: 0, 
      q1: 0,
      q3: 0,
      iqr: 0,
      stdDev: 0,
      variance: 0,
      kurtosis: 0,
      coefficientOfVariation: 0,
      confidenceInterval: [0, 0],
      isSkewed: false, 
      skewDirection: 'none' 
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / values.length;

  // Midpoint stats
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;

  // Mode
  const counts: Record<number, number> = {};
  let maxFreq = 0;
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxFreq) maxFreq = counts[v];
  });
  const mode = Object.keys(counts).map(Number).filter(k => counts[k] === maxFreq && maxFreq > 1);

  // Variance & StdDev
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Kurtosis calculation
  const fourthDiffs = values.map(v => Math.pow(v - mean, 4));
  const avgFourth = fourthDiffs.reduce((a, b) => a + b, 0) / values.length;
  const kurtosis = (avgFourth / Math.pow(variance, 2)) - 3;

  // Coefficient of Variation
  const coefficientOfVariation = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Confidence Interval (95% approx: mean +/- 1.96 * (stdDev / sqrt(n)))
  const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length));
  const confidenceInterval: [number, number] = [mean - marginOfError, mean + marginOfError];

  const diff = Math.abs(mean - median);
  const threshold = median * 0.1;
  const isSkewed = diff > threshold;
  
  let skewDirection: 'left' | 'right' | 'none' = 'none';
  if (isSkewed) {
    skewDirection = mean > median ? 'right' : 'left';
  }

  // Quartiles
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  return {
    type: 'numerical',
    mean,
    median,
    mode,
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1,
    q3,
    iqr,
    stdDev,
    variance,
    kurtosis,
    coefficientOfVariation,
    confidenceInterval,
    isSkewed,
    skewDirection
  };
}

export function calculateCategoricalStats(values: string[]): CategoricalStats {
  const counts: Record<string, number> = {};
  let totalLength = 0;
  
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
    totalLength += v.length;
  });

  const uniqueValues = Object.keys(counts);
  let maxFreq = 0;
  let topCategory = '';
  
  const frequencyArray = uniqueValues.map(v => ({
    label: v,
    value: counts[v]
  })).sort((a, b) => b.value - a.value);

  if (frequencyArray.length > 0) {
    maxFreq = frequencyArray[0].value;
    topCategory = frequencyArray[0].label;
  }

  const mode = uniqueValues.filter(v => counts[v] === maxFreq && maxFreq > 1);

  return {
    type: 'categorical',
    count: values.length,
    uniqueCount: uniqueValues.length,
    topCategory,
    topCategoryFrequency: maxFreq,
    frequencies: frequencyArray.slice(0, 10), // Top 10 for charts
    mode,
    avgLength: totalLength / values.length
  };
}

export function calculateCorrelations(series: DataSeries[]): CorrelationResult[] {
  const result: CorrelationResult[] = [];
  const numericalSeries = series.filter(s => s.stats.type === 'numerical');

  for (let i = 0; i < numericalSeries.length; i++) {
    for (let j = i + 1; j < numericalSeries.length; j++) {
      const s1 = numericalSeries[i];
      const s2 = numericalSeries[j];
      
      const v1 = s1.data.map(d => d.value);
      const v2 = s2.data.map(d => d.value);
      
      // Ensure equal lengths
      const minLen = Math.min(v1.length, v2.length);
      const x = v1.slice(0, minLen);
      const y = v2.slice(0, minLen);
      
      const n = x.length;
      if (n === 0) continue;
      
      const meanX = x.reduce((a, b) => a + b) / n;
      const meanY = y.reduce((a, b) => a + b) / n;
      
      let num = 0;
      let denX = 0;
      let denY = 0;
      
      for (let k = 0; k < n; k++) {
        const dx = x[k] - meanX;
        const dy = y[k] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      
      const coefficient = denX === 0 || denY === 0 ? 0 : num / (Math.sqrt(denX) * Math.sqrt(denY));
      
      result.push({
        colA: s1.columnName,
        colB: s2.columnName,
        coefficient
      });
    }
  }
  return result;
}

export function calculateRegression(x: number[], y: number[]): RegressionResult {
  const n = Math.min(x.length, y.length);
  const xData = x.slice(0, n);
  const yData = y.slice(0, n);
  
  const sumX = xData.reduce((a, b) => a + b, 0);
  const sumY = yData.reduce((a, b) => a + b, 0);
  const sumXY = xData.reduce((a, v, i) => a + v * yData[i], 0);
  const sumX2 = xData.reduce((a, v) => a + v * v, 0);
  const sumY2 = yData.reduce((a, v) => a + v * v, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // R-squared
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r2 = Math.pow(num / den, 2);
  
  return { slope, intercept, r2 };
}

import jStat from 'jstat';

export function performTTest(s1: NumericalStats, s2: NumericalStats): { t: number, p: number, df: number } {
  const n1 = s1.count;
  const n2 = s2.count;
  const m1 = s1.mean;
  const m2 = s2.mean;
  const v1 = s1.variance;
  const v2 = s2.variance;
  
  // Welch's T-test
  // Standard error
  const se = Math.sqrt((v1 / n1) + (v2 / n2));
  const t = (m1 - m2) / se;
  
  // Welch-Satterthwaite equation for degrees of freedom
  const dfNumerator = Math.pow((v1 / n1) + (v2 / n2), 2);
  const dfDenominator = (Math.pow(v1 / n1, 2) / (n1 - 1)) + (Math.pow(v2 / n2, 2) / (n2 - 1));
  const df = dfNumerator / dfDenominator;
  
  // Two-tailed p-value
  // jStat.studentt.cdf gives the area to the left of t.
  // For two-tailed, we want 2 * (1 - cdf(|t|))
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  
  return { t, p, df };
}

export function createDataSeries(columnName: string, rawValues: any[]): DataSeries {
  const numericalValues = rawValues.filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''));
  const processedNumerical = numericalValues.map(v => typeof v === 'number' ? v : Number(v));
  
  const stringValues = rawValues.filter(v => typeof v === 'string' && isNaN(Number(v)));

  if (processedNumerical.length >= stringValues.length && processedNumerical.length > 0) {
    const points: DataPoint[] = processedNumerical.map((v, i) => ({
      index: i,
      label: `Row ${i + 1}`,
      value: v
    }));
    
    return {
      columnName,
      data: points,
      stats: calculateStats(processedNumerical)
    };
  } else {
    const finalStrings = stringValues.length > 0 ? stringValues : rawValues.map(v => v.toString());
    const points: DataPoint[] = finalStrings.map((v, i) => ({
      index: i,
      label: `Row ${i + 1}`,
      value: 0,
      stringValue: v
    }));

    return {
      columnName,
      data: points,
      stats: calculateCategoricalStats(finalStrings)
    };
  }
}

export function parseManualInput(text: string): DataSeries[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Detect delimiter (comma or tab)
  const firstLine = lines[0];
  const hasComma = firstLine.includes(',');
  const hasTab = firstLine.includes('\t');
  const delimiter = hasTab ? '\t' : (hasComma ? ',' : /[\s]+/);

  const headerRow = firstLine.split(delimiter).map(h => h.trim());
  const dataLines = lines.length > 1 ? lines.slice(1) : lines; 
  
  // If only one line, check if it's headers or data
  const isAllNumeric = (row: string[]) => row.every(v => !isNaN(Number(v)) && v.trim() !== '');
  
  let finalHeaders: string[] = [];
  let finalDataRows: string[][] = [];

  if (lines.length === 1) {
    if (isAllNumeric(headerRow)) {
      finalHeaders = headerRow.map((_, i) => `Column ${i + 1}`);
      finalDataRows = [headerRow];
    } else {
      finalHeaders = headerRow;
      finalDataRows = [];
    }
  } else {
    if (isAllNumeric(headerRow)) {
      finalHeaders = headerRow.map((_, i) => `Column ${i + 1}`);
      finalDataRows = lines.map(line => line.split(delimiter).map(v => v.trim()));
    } else {
      finalHeaders = headerRow;
      finalDataRows = lines.slice(1).map(line => line.split(delimiter).map(v => v.trim()));
    }
  }

  const series: DataSeries[] = [];
  const numCols = finalHeaders.length;

  for (let c = 0; c < numCols; c++) {
    const colValues: any[] = [];
    finalDataRows.forEach(row => {
      const val = row[c];
      if (val !== undefined && val !== '') {
        const num = Number(val);
        colValues.push(isNaN(num) ? val : num);
      }
    });
    
    if (colValues.length > 0 || finalDataRows.length === 0) {
      series.push(createDataSeries(finalHeaders[c] || `Column ${c + 1}`, colValues));
    }
  }

  return series;
}
