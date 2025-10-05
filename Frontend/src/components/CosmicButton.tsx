import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CosmicButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const CosmicButton = forwardRef<HTMLButtonElement, CosmicButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 relative overflow-hidden';
    
    const variantStyles = {
      primary: 'bg-gradient-to-r from-primary via-secondary to-accent text-white hover:scale-105',
      secondary: 'bg-secondary/20 text-secondary border-2 border-secondary hover:bg-secondary/30',
      outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/10',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const glowClass = glow ? 'cosmic-glow' : '';

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          glowClass,
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

CosmicButton.displayName = 'CosmicButton';
