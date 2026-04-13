import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';
import { useRef } from 'react';

export default function GradientText({
  children, className = '', colors = ['#6C63FF', '#FF6B8A', '#6C63FF'],
  animationSpeed = 6, direction = 'horizontal'
}) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const dur = animationSpeed * 1000;

  useAnimationFrame(time => {
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const full = dur * 2;
    const ct = elapsedRef.current % full;
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100);
  });

  const backgroundPosition = useTransform(progress, p =>
    direction === 'horizontal' ? `${p}% 50%` : `50% ${p}%`
  );

  const gradientColors = [...colors, colors[0]].join(', ');

  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        backgroundImage: `linear-gradient(to right, ${gradientColors})`,
        backgroundSize: '300% 100%',
        backgroundRepeat: 'repeat',
        backgroundPosition,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </motion.span>
  );
}
