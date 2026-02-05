import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const GenreChart = ({ genres }) => {
  if (!genres || genres.length === 0) {
    return (
      <div className="bg-pastel-card rounded-2xl p-6 border-2 border-white/50">
        <h2 className="font-pixel text-sm text-text-primary mb-4">Top Genres</h2>
        <p className="text-text-muted">No genre data available</p>
      </div>
    );
  }

  // Pastel rainbow colors for the chart
  const pastelColors = [
    '#FFB5C5', // pastel pink
    '#D4C8E8', // pastel lavender
    '#B8E8D0', // pastel mint
    '#FFD0C0', // pastel peach
    '#FFF0B8', // pastel yellow
    '#B8D8F0', // pastel blue
    '#E8C8D8', // pastel rose
    '#C8E8E0', // pastel teal
  ];

  const data = {
    labels: genres.map(g => g.name),
    datasets: [{
      data: genres.map(g => g.count),
      backgroundColor: pastelColors,
      borderColor: '#FFFFFF',
      borderWidth: 3,
    }]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#5C4B6B',
          padding: 15,
          font: { 
            size: 12,
            family: 'Nunito'
          }
        }
      },
      tooltip: {
        backgroundColor: '#FFF5F7',
        titleColor: '#5C4B6B',
        bodyColor: '#8B7A9B',
        borderColor: '#FFB5C5',
        borderWidth: 2,
        cornerRadius: 12,
        padding: 12,
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl p-6 pb-[18px] shadow-pastel hover:shadow-pastel-lg transition-shadow border-2 border-white/50 mb-[18px]">
      <div className="flex items-center gap-3 mb-6" style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '10px', paddingRight: '10px' }}>
        <div className="w-10 h-10 bg-pastel-mint rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-text-primary" />
        </div>
        <h2 className="font-pixel text-sm text-text-primary">Top Genres</h2>
      </div>

      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default GenreChart;
