import React from 'react';

interface UnreadIndicatorProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

const UnreadIndicator: React.FC<UnreadIndicatorProps> = ({ 
  count, 
  onClick,
  className = ''
}) => {
  if (count <= 0) return null;
  
  return (
    <div 
      className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
      onClick={onClick}
    >
      {count > 9 ? '9+' : count}
    </div>
  );
};

export default UnreadIndicator;