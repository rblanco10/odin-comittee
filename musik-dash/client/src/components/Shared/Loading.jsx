import { Music } from 'lucide-react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pastel-bg via-pastel-bg-alt to-pastel-lavender/30">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-20 h-20 border-4 border-pastel-lavender border-t-pastel-pink rounded-full animate-spin"></div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-pastel-card rounded-xl flex items-center justify-center shadow-pastel">
            <Music className="w-5 h-5 text-pastel-pink animate-pulse" />
          </div>
        </div>
      </div>
      <p className="mt-6 text-text-secondary font-medium">{message}</p>
    </div>
  );
};

export default Loading;
