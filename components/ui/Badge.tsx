
import React from 'react';

interface BadgeProps {
  color: 'green' | 'yellow' | 'blue' | 'gray';
  children: React.ReactNode;
}

const colorClasses = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
};

const Badge: React.FC<BadgeProps> = ({ color, children }) => {
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}>
      {children}
    </span>
  );
};

export default Badge;
