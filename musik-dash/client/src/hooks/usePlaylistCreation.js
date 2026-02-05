import { useState, useMemo, useCallback } from 'react';
import { timeMachineAPI } from '../services/api';

export const usePlaylistCreation = (year) => {
  const [selectedTrackIds, setSelectedTrackIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState(null);

  const toggleTrack = useCallback((trackId) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const selectedCount = useMemo(() => selectedTrackIds.size, [selectedTrackIds]);

  const isSelected = useCallback(
    (trackId) => selectedTrackIds.has(trackId),
    [selectedTrackIds]
  );

  const createPlaylist = useCallback(async () => {
    if (selectedTrackIds.size === 0) {
      setError('Please select at least one track');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await timeMachineAPI.createPlaylist(
        year,
        Array.from(selectedTrackIds),
        `${year} Throwback`,
        `Top tracks from ${year} - Created by Musik Dash`
      );
      setCreated(true);
      setTimeout(() => setCreated(false), 3000);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [year, selectedTrackIds]);

  const clearError = useCallback(() => setError(null), []);

  return {
    selectedTrackIds,
    selectedCount,
    isSelected,
    toggleTrack,
    createPlaylist,
    creating,
    created,
    error,
    clearError
  };
};
