import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface BentoSpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoSpotlight: React.FC<BentoSpotlightProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Check if device supports hover to disable 3D tilt on touch devices
  const [isHoverable] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true
  );
  
  // Spotlight coordinates relative to the card element
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // 3D Tilt values (normalized 0.0 to 1.0)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Smooth springs for rotation
  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 180, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHoverable || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Coords relative to card
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setCoords({ x: mouseX, y: mouseY });

    // Normalized positions inside the card
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    x.set(normX);
    y.set(normY);
  };

  const handleMouseLeave = () => {
    if (!isHoverable) return;
    // Reset card tilt to center on mouse leave
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...(isHoverable ? {
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        } : {}),
        // Custom properties mapped to CSS radial spotlight
        // @ts-ignore
        '--mouse-x': `${coords.x}px`,
        // @ts-ignore
        '--mouse-y': `${coords.y}px`,
      }}
      className={`bento-spotlight ${className}`}
    >
      <div 
        style={isHoverable ? { transform: 'translateZ(0px)', transformStyle: 'preserve-3d', position: 'relative', zIndex: 15 } : { position: 'relative', zIndex: 15 }} 
        className="h-full w-full flex flex-col"
      >
        {children}
      </div>
    </motion.div>
  );
};
