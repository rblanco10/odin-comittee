import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, LogOut, User, Music } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-pastel-pink' },
    { path: '/timemachine', label: 'Time Machine', icon: Clock, color: 'bg-pastel-lavender' },
  ];

  return (
    <nav className="bg-pastel-card/80 backdrop-blur-lg border-b-2 border-pastel-pink/30 sticky top-0 z-50 shadow-pastel" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pastel-pink to-pastel-lavender rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5 text-text-primary" />
            </div>
            <span className="font-pixel text-xs text-text-primary hidden sm:block">Musik Dash</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 rounded-xl transition-all font-semibold
                    ${isActive
                      ? `${item.color} text-text-primary shadow-pastel border-2 border-white/50`
                      : 'text-text-secondary hover:text-text-primary hover:bg-pastel-card-alt'
                    }
                  `}
                  style={{ margin: '10px', padding: '8px' }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* User Menu */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-pastel-lavender/30">
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-xl border-2 border-pastel-pink shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-pastel-lavender flex items-center justify-center">
                      <User className="w-4 h-4 text-text-primary" />
                    </div>
                  )}
                  <span className="text-text-secondary font-medium">{user.displayName}</span>
                </div>
              )}
              
              <button 
                onClick={logout}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-pastel-peach/50 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
