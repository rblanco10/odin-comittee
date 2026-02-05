import { Music } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

const TopTracks = ({ tracks }) => { 

  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-pastel-card rounded-2xl p-6 border-2 border-white/50">
        <h2 className="font-pixel text-sm text-text-primary mb-4">Top Tracks</h2>
        <p className="text-text-muted">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl py-6 shadow-pastel hover:shadow-pastel-lg transition-shadow border-2 border-white/50" style={{ paddingLeft: '18px', paddingRight: '18px' }}>
      <div className="flex items-center gap-3 mb-6" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <div className="w-10 h-10 bg-pastel-lavender rounded-xl flex items-center justify-center">
          <Music className="w-5 h-5 text-text-primary" />
        </div>
        <h2 className="font-pixel text-sm text-text-primary">Top Tracks</h2>
      </div>

      <div className="space-y-3">
        {tracks.slice(0, 10).map((track, index) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-pastel-lavender/20 transition-colors group cursor-pointer"
            style={{ paddingTop: '7px', paddingBottom: '7px' }}
          >
            {/* Rank */}
            <span className="text-xl font-bold text-pastel-pink w-6">
              {index + 1}
            </span>

            {/* Album Art */}
            <img
              src={track.album.images[0]?.url || '/placeholder-album.png'}
              alt={track.name}
              className="w-14 h-14 rounded-xl shadow-pastel border-2 border-white/50"
            />

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text-primary truncate group-hover:text-pastel-pink-dark transition-colors">
                {track.name}
              </h3>
              <p className="text-sm text-text-muted truncate">
                {track.artists.map(a => a.name).join(', ')}
              </p>
            </div>

            {/* Duration */}
            <span className="text-sm text-text-secondary font-medium">
              {formatDuration(track.duration_ms)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTracks;
