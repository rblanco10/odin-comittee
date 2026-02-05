import { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import Navbar from '../components/Shared/Navbar';
import YearSelector from '../components/TimeMachine/YearSelector';
import PlaylistPreview from '../components/TimeMachine/PlaylistPreview';
import Loading from '../components/Shared/Loading';
import { timeMachineAPI } from '../services/api';

const TimeMachinePage = () => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracks(selectedYear);
  }, [selectedYear]);

  const fetchTracks = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const data = await timeMachineAPI.searchByYear(year);
      setTracks(data.tracks);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError(err.response?.data?.error || 'Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-bg via-pastel-lavender/30 to-pastel-bg-alt">
      <Navbar />
      
      <div className="flex justify-center w-full">
        <main className="max-w-4xl w-full px-6 py-12">
        {/* Header Section */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-4 mb-6 bg-pastel-card/80 backdrop-blur-sm rounded-2xl shadow-pastel border-2 border-white/50" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '9px', paddingRight: '9px', marginTop: '9px', marginBottom: '9px' }}>
            <Clock className="w-8 h-8 text-pastel-lavender" />
            <h1 className="font-pixel text-lg text-text-primary">
              Music Time Machine
            </h1>
            <Sparkles className="w-6 h-6 text-pastel-pink" />
          </div>
        </header>

        {/* Year Selector Section */}
        <section className="mb-10">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-pastel-peach/50 border-2 border-pastel-peach text-text-primary px-6 py-4 rounded-xl mb-8 text-center">
            {error}
          </div>
        )}

        {/* Results Section */}
        <section>
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-pastel-lavender border-t-pastel-pink"></div>
            </div>
          ) : (
            <PlaylistPreview tracks={tracks} year={selectedYear} />
          )}
        </section>
      </main>
      </div>
    </div>
  );
};

export default TimeMachinePage;
