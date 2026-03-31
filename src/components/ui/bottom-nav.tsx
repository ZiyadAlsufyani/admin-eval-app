import { cn } from '@/lib/utils';
import { Icon, type IconName } from './icon';

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string, href: string) => void;
}

export function BottomNav({ items, activeId, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* 
        For iOS/Android edge-to-edge support: 
        pb-safe pushes the inner content up, dodging the gesture bar 
      */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/15 flex items-center justify-around px-2 py-3 pb-safe">
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id, item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ease-out flex-1 mx-1',
                isActive ? 'text-vertex-teal' : 'text-secondary hover:bg-surface-container-low'
              )}
            >
              <div className="relative">
                <Icon 
                  name={item.icon} 
                  size={24} 
                  className={cn(
                    isActive ? 'scale-110' : 'scale-100'
                  )}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] uppercase tracking-wider mt-1.5 font-semibold transition-all duration-300',
                isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-[2px]'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
