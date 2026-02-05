import { Music2 } from 'lucide-react';

const TopArtists = ({ artists }) => { 
  if (!artists || artists.length === 0) {
    return (
      <div className="bg-pastel-card rounded-2xl p-6 border-2 border-white/50">
        <h2 className="font-pixel text-sm text-text-primary mb-4">Top Artists</h2>
        <p className="text-text-muted">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl py-6 px-5 shadow-pastel hover:shadow-pastel-lg transition-shadow border-2 border-white/50" style={{ paddingLeft: '18px', paddingRight: '18px' }}>
      <div className="flex items-center gap-3 mb-6" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <div className="w-10 h-10 bg-pastel-pink rounded-xl flex items-center justify-center">
          <Music2 className="w-5 h-5 text-text-primary" />
        </div>
        <h2 className="font-pixel text-sm text-text-primary">Top Artists</h2>
      </div>

      <div className="space-y-3">
        {artists.slice(0, 10).map((artist, index) => (
          <div
            key={artist.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-pastel-pink/20 transition-colors group"
            style={{ paddingTop: '7px', paddingBottom: '7px' }}
          >
            {/* Rank */}
            <span className="text-2xl font-bold text-pastel-lavender w-8">
              {index + 1}
            </span>

            {/* Artist Image */}
            <img
              src={artist.images[0]?.url || '/placeholder-artist.png'}
              alt={artist.name}
              className="w-14 h-14 rounded-xl object-cover shadow-pastel border-2 border-white/50"
            />

            {/* Artist Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text-primary group-hover:text-pastel-pink-dark transition-colors truncate">
                {artist.name}
              </h3>
              <p className="text-sm text-text-muted truncate">
                {artist.genres.slice(0, 2).join(', ') || 'No genres'}
              </p>
            </div>

            {/* Popularity Bar */}
            <div className="hidden md:block w-24">
              <div className="h-2 bg-pastel-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pastel-pink to-pastel-lavender transition-all rounded-full"
                  style={{ width: `${artist.popularity}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1 text-center">{artist.popularity}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopArtists;
