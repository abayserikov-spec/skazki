import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';
import { useRef } from 'react';

const ShinyText = ({
  text, speed = 3, className = '', color = '#8E86A8',
  shineColor = '#6C63FF', spread = 120
}) => {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const dur = speed * 1000;

  useAnimationFrame(time => {
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const ct = elapsedRef.current % (dur * 2);
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
      }}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
