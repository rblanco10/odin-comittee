import { Music, Plus, Check, X, Sparkles } from 'lucide-react';
import { usePlaylistCreation } from '../../hooks/usePlaylistCreation';
import { formatDuration } from '../../utils/formatters';

const TrackRow = ({ track, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(track.id)}
      className={`
        flex items-center gap-5 px-5 py-4 rounded-xl cursor-pointer transition-all
        ${isSelected
          ? 'bg-pastel-pink/30 border-2 border-pastel-pink'
          : 'bg-pastel-bg/50 hover:bg-pastel-lavender/30 border-2 border-transparent'
        }
      `}
      style={{ padding: '9px' }}
    >
      {/* Selection Indicator */}
      <div className={`
        w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
        ${isSelected
          ? 'bg-pastel-pink border-pastel-pink-dark'
          : 'border-pastel-lavender bg-white/50'
        }
      `}>
        {isSelected && <Check className="w-4 h-4 text-text-primary" />}
      </div>

      {/* Album Art */}
      <img
        src={track.album.images[0]?.url || '/placeholder-album.png'}
        alt={track.name}
        className="w-12 h-12 rounded-xl shadow-pastel border-2 border-white/50 flex-shrink-0"
      />

      {/* Track Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-bold text-text-primary truncate leading-tight">{track.name}</h3>
        <p className="text-sm text-text-muted truncate mt-1">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Popularity & Duration */}
      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
        <div className="text-sm text-text-secondary w-24 text-right">
          <span className="text-text-primary font-bold">{track.popularity}%</span> popular
        </div>
        <span className="text-sm text-text-muted font-medium w-12 text-right">
          {formatDuration(track.duration_ms)}
        </span>
      </div>
    </div>
  );
};

const PlaylistPreview = ({ tracks, year }) => {
  const {
    selectedCount,
    isSelected,
    toggleTrack,
    createPlaylist,
    creating,
    created,
    error,
    clearError
  } = usePlaylistCreation(year);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-white/50">
        <Music className="w-16 h-16 text-pastel-lavender mx-auto mb-6" />
        <p className="text-text-muted text-lg">No tracks found for this year</p>
      </div>
    );
  }

  return (
    <div className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl shadow-pastel border-2 border-white/50" style={{ padding: '19px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
        <div>
          <h2 className="font-pixel text-sm text-text-primary mb-2">Top Tracks from {year}</h2>
          <p className="text-text-secondary">{tracks.length} tracks found</p>
        </div>
        
        <button
          onClick={createPlaylist}
          disabled={selectedCount === 0 || creating}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all border-2
            ${selectedCount > 0 && !creating
              ? 'bg-pastel-mint hover:bg-pastel-mint-dark text-text-primary shadow-pastel border-white/50'
              : 'bg-pastel-bg text-text-muted cursor-not-allowed border-transparent'
            }
          `}
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-text-primary border-t-transparent"></div>
              Creating...
            </>
          ) : created ? (
            <>
              <Sparkles className="w-5 h-5" />
              Created!
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Create Playlist ({selectedCount})
            </>
          )}
        </button>
      </div>

      {/* Inline error message */}
      {error && (
        <div className="flex items-center justify-between bg-pastel-peach/50 border-2 border-pastel-peach text-text-primary px-6 py-4 rounded-xl mb-6">
          <span>{error}</span>
          <button onClick={clearError} className="ml-4 hover:opacity-70 transition-opacity p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Track List */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isSelected={isSelected(track.id)}
            onToggle={toggleTrack}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistPreview;
