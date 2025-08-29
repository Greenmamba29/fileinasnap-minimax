import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { signOut } from '../lib/supabase';
import { useTranslate } from '../hooks/useI18nContext';
import { Menu, X, Search, Bell, Settings, LogOut } from 'lucide-react';
import { colors } from '../lib/design-system';
import { LanguageSelector } from './LanguageSelector';

interface TopBarProps {
  user: User | null;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function TopBar({ user, onMenuToggle, sidebarOpen }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = useTranslate();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <div 
      className="h-16 bg-white border-b flex items-center justify-between px-4 relative z-10"
      style={{ borderColor: colors.primary.lightGray }}
    >
      {/* Left side - Menu and Logo */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="flex items-center space-x-3">
          <img 
            src="/icons/logo-fileinasnap.png" 
            alt="FileInASnap" 
            className="h-8 w-8"
          />
          <h1 
            className="text-xl font-semibold hidden sm:block"
            style={{ color: colors.text.primary }}
          >
            {t('common:appName')}
          </h1>
        </div>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={18} 
          />
          <input
            type="text"
            placeholder={t('common:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.primary.lightGray,
              '--tw-ring-color': colors.primary.blue 
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Right side - Actions and User */}
      <div className="flex items-center space-x-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} style={{ color: colors.text.secondary }} />
        </button>
        
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings size={18} style={{ color: colors.text.secondary }} />
        </button>

        {/* Language Selector */}
        <LanguageSelector compact />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} style={{ color: colors.text.secondary }} />
                <span className="text-sm" style={{ color: colors.text.primary }}>
                  {t('auth:signOut')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}