import { useEffect, useState, type ReactNode } from 'react';

interface PageRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

const PageReveal = ({ children, className = '', delay = 0, duration = 330 }: PageRevealProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timerId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      timerId = window.setTimeout(() => {
        setVisible(true);
      }, delay);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [delay]);

  return (
    <div
      className={`motion-reduce:transform-none motion-reduce:opacity-100 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.985)',
        filter: visible ? 'blur(0px)' : 'blur(3px)',
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {children}
    </div>
  );
};

export default PageReveal;