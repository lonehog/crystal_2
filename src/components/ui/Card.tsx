import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  const baseClass = hover ? 'glass-card-hover' : 'glass-card';
  
  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
