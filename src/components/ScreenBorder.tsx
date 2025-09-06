import React from 'react';

interface ScreenBorderProps {
  children: React.ReactNode;
}

export function ScreenBorder({ children }: ScreenBorderProps) {
  return (
    <div className="min-h-screen relative">
      {/* Decorative elements for larger screens */}
      <div className="hidden lg:block">
        {/* Top border */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-beach-water via-beach-sunset to-beach-water"></div>
        
        {/* Left border with sea creatures */}
        <div className="absolute top-8 left-0 bottom-8 w-16 bg-beach-deep-water">
          <div className="h-full flex flex-col justify-around items-center py-8">
            {/* Decorative sea creatures */}
            <div className="w-8 h-8 bg-beach-coral rounded-full pixel-border"></div>
            <div className="w-6 h-10 bg-beach-seaweed pixel-border"></div>
            <div className="w-10 h-6 bg-beach-sunset rounded-full pixel-border"></div>
            <div className="w-8 h-8 bg-beach-purple rounded-full pixel-border"></div>
            <div className="w-12 h-4 bg-beach-foam pixel-border"></div>
            <div className="w-6 h-8 bg-beach-coral pixel-border"></div>
          </div>
        </div>
        
        {/* Right border with rocks */}
        <div className="absolute top-8 right-0 bottom-8 w-16 bg-beach-purple">
          <div className="h-full flex flex-col justify-around items-center py-8">
            {/* Decorative rocks */}
            <div className="w-6 h-6 bg-beach-dark-rock pixel-border"></div>
            <div className="w-8 h-4 bg-beach-foam pixel-border"></div>
            <div className="w-4 h-8 bg-beach-dark-rock pixel-border"></div>
            <div className="w-10 h-6 bg-beach-rock pixel-border"></div>
            <div className="w-6 h-10 bg-beach-dark-rock pixel-border"></div>
            <div className="w-8 h-8 bg-beach-foam pixel-border"></div>
          </div>
        </div>
        
        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-beach-sand via-beach-foam to-beach-sand"></div>
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-16 h-8 bg-beach-purple"></div>
        <div className="absolute top-0 right-0 w-16 h-8 bg-beach-deep-water"></div>
        <div className="absolute bottom-0 left-0 w-16 h-8 bg-beach-seaweed"></div>
        <div className="absolute bottom-0 right-0 w-16 h-8 bg-beach-sunset"></div>
      </div>
      
      {/* Main content area */}
      <div className="relative lg:mx-16 lg:my-8">
        {children}
      </div>
    </div>
  );
}