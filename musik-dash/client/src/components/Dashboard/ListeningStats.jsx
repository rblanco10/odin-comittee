import { Headphones, Music, Sparkles } from 'lucide-react';

const ListeningStats = ({ stats }) => {
  const statCards = [
    {
      icon: Music,
      label: 'Total Tracks',
      value: stats?.totalTracks || 0,
      bgColor: 'bg-pastel-pink',
    },
    {
      icon: Headphones,
      label: 'Unique Artists',
      value: stats?.uniqueArtists || 0,
      bgColor: 'bg-pastel-lavender',
    }
  ];

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl p-6 pb-[18px] mt-[18px] mb-[18px] shadow-pastel hover:shadow-pastel-lg transition-shadow border-2 border-white/50">
      <div className="flex items-center gap-3 mb-6" style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '10px', paddingRight: '10px' }}>
        <div className="w-10 h-10 bg-pastel-peach rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-text-primary" />
        </div>
        <h2 className="font-pixel text-sm text-text-primary" style={{ marginTop: '10px', marginBottom: '10px' }}>
          Listening Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor}/50 rounded-xl hover:scale-105 transition-all border-2 border-white/50`}
              style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              <Icon className="w-8 h-8 mb-3 text-text-primary" />
              <p className="text-sm text-text-secondary mb-1 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListeningStats;
