import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconName = keyof typeof LucideIcons;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  // We use LucideIcons dynamically, but because of clean architecture, 
  // if you want to swap to custom animated SVGs later, you just change what 'Icon' renders here.
  const LucideIcon = LucideIcons[name] as React.FC<LucideIcons.LucideProps>;

  if (!LucideIcon) {
    return <span className={cn('block bg-red-500 w-4 h-4', className)} />;
  }

  return <LucideIcon size={size} className={cn('transition-all duration-300', className)} {...props as any} />;
}
