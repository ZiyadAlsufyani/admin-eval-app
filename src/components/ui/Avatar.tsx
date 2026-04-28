import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle';
  className?: string;
};

const PALETTE = [
  'bg-blue-600',    // Classic Blue
  'bg-emerald-600', // Professional Green
  'bg-violet-600',  // Deep Purple
  'bg-rose-600',    // Vibrant Red/Pink
  'bg-amber-700',   // Deep Gold/Yellow (700 for white text contrast)
  'bg-teal-600',    // Brand-aligned Blue-Green
  'bg-indigo-600',  // Dark Blue/Purple
  'bg-fuchsia-600', // Magenta
  'bg-sky-700',     // Light Blue (700 for white text contrast)
  'bg-orange-600',  // Energetic Orange
  'bg-cyan-700',    // Deep Cyan
  'bg-slate-600',   // Professional Neutral Gray
];

const getHashColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

const getInitials = (name: string) => {
  const cleanName = name.trim();
  if (!cleanName) return '??';
  
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
};

export function Avatar({ name, imageUrl, size = 'md', shape = 'square', className }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getHashColor(name);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const shapeClasses = {
    square: 'rounded-xl',
    circle: 'rounded-full',
  };

  return (
    <div 
      className={cn(
        'flex-shrink-0 flex items-center justify-center overflow-hidden border border-surface-container shadow-sm',
        sizeClasses[size],
        shapeClasses[shape],
        !imageUrl && bgColor,
        className
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold tracking-tighter">
          {initials}
        </span>
      )}
    </div>
  );
}
