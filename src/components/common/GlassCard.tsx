import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  subtle?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  subtle = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl transition-all duration-200 ${
        subtle ? 'glass-panel-subtle' : 'glass-panel'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
