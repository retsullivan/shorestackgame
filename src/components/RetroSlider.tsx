interface RetroSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RetroSlider({ value, onChange, min = 0, max = 100, step = 1 }: RetroSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercentage = (clickX / rect.width) * 100;
    const newValue = min + (newPercentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  return (
    <div className="w-full">
      <div 
        className="relative h-6 bg-beach-sand pixel-border cursor-pointer"
        onClick={handleClick}
      >
        {/* Track */}
        <div className="absolute inset-1 bg-beach-rock"></div>
        
        {/* Fill */}
        <div 
          className="absolute inset-1 bg-beach-water transition-all duration-150"
          style={{ width: `${percentage}%` }}
        ></div>
        
        {/* Thumb */}
        <div 
          className="absolute top-0 w-6 h-6 bg-beach-foam pixel-border cursor-grab active:cursor-grabbing transform -translate-x-1/2 transition-all duration-150"
          style={{ left: `${percentage}%` }}
        >
          <div className="w-full h-full bg-beach-water border-2 border-beach-dark-rock"></div>
        </div>
      </div>
      
      {/* Value display */}
      <div className="flex justify-between mt-1">
        <span className="pixel-font text-xs text-beach-dark-rock">{min}</span>
        <span className="pixel-font text-xs text-beach-dark-rock">{value}</span>
        <span className="pixel-font text-xs text-beach-dark-rock">{max}</span>
      </div>
    </div>
  );
}