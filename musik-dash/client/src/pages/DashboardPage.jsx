import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/Shared/Navbar';
import TopArtists from '../components/Dashboard/TopArtists';
import TopTracks from '../components/Dashboard/TopTracks';
import GenreChart from '../components/Dashboard/GenreChart';
import ListeningStats from '../components/Dashboard/ListeningStats';
import TimeRangeSelector from '../components/Dashboard/TimeRangeSelector';
import Loading from '../components/Shared/Loading';
import { statsAPI } from '../services/api';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('medium_term');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const fetchStats = async (range) => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsAPI.getStats(range);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <Loading message="Loading your music stats..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-bg via-pastel-bg-alt to-pastel-lavender/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" style={{ marginLeft: '22px', marginRight: '22px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-pastel-pink-dark" />
            <h1 
              className="font-pixel text-xl text-text-primary"
              style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '5px', paddingRight: '5px', marginTop: '14px' }}
            >
              Your Music Stats
            </h1>
          </div>
          <p className="text-text-secondary" style={{ paddingBottom: '13px' }}>
            Discover your listening patterns and favorite tracks
          </p>
        </div>

        {/* Time Range Selector */}
        <TimeRangeSelector 
          selected={timeRange} 
          onChange={setTimeRange}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-pastel-peach/50 border-2 border-pastel-peach text-text-primary px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pastel-lavender border-t-pastel-pink"></div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Artists */}
            <TopArtists artists={stats.topArtists} />
            
            {/* Top Tracks */}
            <TopTracks tracks={stats.topTracks} />
            
            {/* Genre Chart */}
            <GenreChart genres={stats.genres} />
            
            {/* Listening Stats */}
            <ListeningStats stats={stats.listeningStats} />
          </div>
        ) : (
          <div className="text-center text-text-muted py-12">
            No data available
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
