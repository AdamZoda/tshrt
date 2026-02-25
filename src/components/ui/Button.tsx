import React, { useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const resolvedRef = (ref as any) || internalRef;
    
    const [isHovered, setIsHovered] = useState(false);
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!resolvedRef.current) return;
      const rect = resolvedRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      
      x.set(distanceX * 0.2);
      y.set(distanceY * 0.2);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    const variants = {
      primary: 'bg-white text-black hover:bg-[#D4AF37] hover:text-black',
      secondary: 'bg-transparent border border-white text-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37]',
      ghost: 'bg-transparent text-white hover:text-[#D4AF37]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg font-semibold',
    };

    return (
      <motion.button
        ref={resolvedRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ x: mouseXSpring, y: mouseYSpring }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 relative overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children as React.ReactNode}</span>
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
