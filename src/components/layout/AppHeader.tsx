import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';

type AppHeaderProps = {
  title?: string | ReactNode;
  titleClassName?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AppHeader({ title, titleClassName = "text-foreground", actions, children, className = "" }: AppHeaderProps) {
  const { profile } = useAuth();
  if (children) {
    return (
      <header className={`w-full top-0 sticky z-50 bg-surface/90 backdrop-blur-md border-none flex justify-between items-center px-6 py-4 pt-safe h-16 ${className}`}>
        {children}
      </header>
    );
  }

  return (
    <header className={`w-full top-0 sticky z-50 bg-surface/90 backdrop-blur-md border-none flex justify-between items-center px-6 py-4 pt-safe h-16 ${className}`}>
      <div className="flex flex-col items-start">
        {typeof title === 'string' ? (
          <h1 className={`text-xl font-bold ${titleClassName}`}>{title}</h1>
        ) : (
          title
        )}
      </div>
      <div className="flex items-center gap-3">
        <Avatar 
          name={profile?.full_name || 'المدير'} 
          imageUrl={profile?.avatar_url} 
          shape="circle" 
          size="sm" 
        />
        {actions}
      </div>
    </header>
  );
}
