import React from 'react';

interface ScreenBorderProps {
  children: React.ReactNode;
}

export function ScreenBorder({ children }: ScreenBorderProps) {
  return (
    <div className="w-full">
      
     
     
      {/* Main content area */}
      <div>
        {children}
      </div>

      
    </div>
  );
}