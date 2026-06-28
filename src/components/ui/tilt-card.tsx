'use client';

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
  perspective?: number;
}

export function TiltCard({ children, maxTilt = 8, className = '', perspective = 900 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Mouse positions normalized from -0.5 to 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for smooth physics
  const springConfig = { stiffness: 150, damping: 18 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Map to rotations: 
  // If mouse is on right (positive X), rotateY should be positive to tilt right side *away* or *toward* cursor.
  // We want it to tilt toward the cursor. 
  // Mouse right (X: 0.5) -> rotateY should be positive (right side moves toward viewer, wait... rotateY positive rotates the left side toward viewer.
  // Actually, standard: rotateY(deg). Right side moving toward viewer requires positive rotateY. Wait, no.
  // Looking top-down: positive rotateY rotates the right edge AWAY from the viewer.
  // Let's test: if we want the right edge to come TOWARD the viewer, we need positive X to give positive rotateY. Wait, if rotateY is positive, right goes back. So we need positive X to map to positive rotateY? 
  // Let's just use useTransform.
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate distance from center, normalized to -0.5 to 0.5
    const normalizedX = (e.clientX - rect.left - width / 2) / width;
    const normalizedY = (e.clientY - rect.top - height / 2) / height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: perspective,
        willChange: 'transform',
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}
