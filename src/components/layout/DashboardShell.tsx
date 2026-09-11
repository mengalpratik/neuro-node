import React from 'react';
import { ThemeSettings } from '../../types/dashboard';

interface DashboardShellProps {
  children: React.ReactNode;
  theme: ThemeSettings;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, theme }) => {
  // Determine background style based on theme configuration
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (theme.backgroundType) {
      case 'solid':
        return {
          backgroundColor: theme.backgroundValue,
        };
      case 'gradient':
        return {
          backgroundImage: theme.backgroundValue,
          backgroundAttachment: 'fixed',
        };
      case 'wallpaper':
      case 'custom':
        return {
          backgroundImage: `url("${theme.backgroundValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        };
      default:
        return {
          backgroundColor: '#030705',
        };
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden text-gray-100 flex flex-col transition-all duration-300"
      style={getBackgroundStyle()}
    >
      {/* Dark overlay & vignette to ensure translucent frosted-glass cards maintain 100% text readability */}
      {(theme.backgroundType === 'wallpaper' || theme.backgroundType === 'custom') && (
        <div className="fixed inset-0 bg-black/60 backdrop-brightness-75 pointer-events-none z-0" />
      )}

      {/* Cyber Grid pattern */}
      <div className="fixed inset-0 cyber-grid-overlay pointer-events-none z-0 opacity-40" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
