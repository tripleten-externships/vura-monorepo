import React from 'react';

// Shared UI components for the Vura monorepo

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

// Placeholder for future UI components
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

export const Card: React.FC<CardProps> = ({ children, title, className }) => {
  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};
