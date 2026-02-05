import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const currentYear = new Date().getFullYear();

const YearSelector = ({ selectedYear, onYearChange }) => {
  const years = useMemo(
    () => Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i),
    []
  );

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl shadow-pastel border-2 border-white/50" style={{ padding: '19px', marginBottom: '22px' }}>
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-8" style={{ marginBottom: '10px' }}>
        <button
          onClick={() => onYearChange(selectedYear + 1)}
          disabled={selectedYear >= currentYear}
          className="p-4 rounded-xl bg-pastel-lavender/50 hover:bg-pastel-lavender disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </button>

        <div className="text-center min-w-[160px]">
          <div className="font-pixel text-4xl text-text-primary mb-2">
            {selectedYear}
          </div>
          <p className="text-text-secondary text-sm">Select a year to explore</p>
        </div>

        <button
          onClick={() => onYearChange(selectedYear - 1)}
          disabled={selectedYear <= 1950}
          className="p-4 rounded-xl bg-pastel-lavender/50 hover:bg-pastel-lavender disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-text-primary" />
        </button>
      </div>

      {/* Year Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-4 max-h-52 overflow-y-auto p-1">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`
              py-2.5 rounded-xl text-sm font-semibold transition-all
              ${year === selectedYear
                ? 'bg-pastel-pink text-text-primary shadow-pastel border-2 border-white/50'
                : 'bg-pastel-bg text-text-secondary hover:bg-pastel-lavender/50 border-2 border-transparent'
              }
            `}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearSelector;
