import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}