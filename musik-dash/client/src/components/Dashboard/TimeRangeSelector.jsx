const TimeRangeSelector = ({ selected, onChange }) => {
  const ranges = [
    { value: 'short_term', label: 'Last 4 Weeks', color: 'bg-pastel-pink' },
    { value: 'medium_term', label: 'Last 6 Months', color: 'bg-pastel-lavender' },
    { value: 'long_term', label: 'All Time', color: 'bg-pastel-mint' }
  ];

  return (
    <div className="flex gap-3 flex-wrap mb-8" style={{ paddingBottom: '14px' }}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`
            rounded-xl font-semibold transition-all border-2
            ${selected === range.value
              ? `${range.color} text-text-primary shadow-pastel border-white/50`
              : 'bg-pastel-card text-text-secondary hover:bg-pastel-card-alt border-transparent hover:border-pastel-pink/30'
            }
          `}
          style={{ paddingLeft: '5px', paddingRight: '5px', paddingTop: '8px', paddingBottom: '8px' }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
