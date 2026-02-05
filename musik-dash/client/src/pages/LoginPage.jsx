import { Music, TrendingUp, Clock, Users, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';

const LoginPage = () => {
  const handleLogin = () => {
    authAPI.login();
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Music Stats',
      description: 'Discover your top artists, tracks, and listening patterns',
      color: 'bg-pastel-pink'
    },
    {
      icon: Clock,
      title: 'Time Machine',
      description: 'Travel back in time and explore music from any year',
      color: 'bg-pastel-lavender'
    },
    {
      icon: Users,
      title: 'Social',
      description: 'Compare your music taste with friends (coming soon)',
      color: 'bg-pastel-mint'
    },
    {
      icon: Music,
      title: 'Playlists',
      description: 'Generate custom playlists based on your preferences',
      color: 'bg-pastel-peach'
    }
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-pastel-bg via-pastel-bg-alt to-pastel-lavender/30 flex items-center justify-center p-4 overflow-auto">
      {/* Decorative floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-pastel-pink/30 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-pastel-mint/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pastel-lavender/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-pastel-peach/30 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-3xl w-full relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pastel-pink to-pastel-lavender rounded-2xl flex items-center justify-center shadow-pastel-lg rotate-3 hover:rotate-0 transition-transform my-3">
              <Music className="w-10 h-10 text-text-primary" />
            </div>
          </div>
          <h1 className="font-pixel text-5xl font-semibold mb-6 text-text-primary leading-relaxed">
            Musik Dash
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-pastel-pink-dark" />
            <p className="text-lg text-text-secondary font-semibold">
              Your cozy music journey starts here
            </p>
            <Sparkles className="w-5 h-5 text-pastel-pink-dark" />
          </div>
          <div className="flex items-center justify-center">
            <p className="text-text-muted max-w-md py-2.5 mb-6">
              Analyze your listening habits, explore musical time periods, and create amazing playlists.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4" style={{ marginTop: '25px', marginBottom: '25px' }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-pastel-card/80 backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all shadow-pastel hover:shadow-pastel-lg border-2 border-white/50"
                style={{ margin: '10px', padding: '10px' }}
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className="w-6 h-6 text-text-primary" />
                </div>
                <h3 className="font-bold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-snug">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Login Button */}
        <div className="text-center px-4">
          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-pastel-pink to-pastel-lavender hover:from-pastel-pink-dark hover:to-pastel-lavender text-text-primary font-bold py-5 px-10 rounded-2xl text-lg transition-all shadow-pastel-lg hover:shadow-pastel hover:scale-105 border-2 border-white/50 mb-6"
            style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '9px', paddingRight: '9px', marginTop: '6px', marginBottom: '6px' }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Login with Spotify
          </button>
        </div>
      </div>

      {/* Disclaimer at bottom of screen */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-4">
        <p className="text-sm text-text-muted text-center">
          By logging in, you agree to share your Spotify listening data
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
