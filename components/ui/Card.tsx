
import React, { ReactNode, useEffect } from 'react';

interface CardProps {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm ${className}`}>
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
            <i data-lucide={icon} className="w-6 h-6"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Card;
