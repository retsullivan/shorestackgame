interface RetroToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function RetroToggle({ checked, onChange, label }: RetroToggleProps) {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 pixel-border transition-all duration-200 ${
          checked ? 'bg-beach-water' : 'bg-beach-sand'
        }`}
      >
        {/* Track */}
        <div className={`absolute inset-1 ${checked ? 'bg-beach-deep-water' : 'bg-beach-rock'}`}></div>
        
        {/* Thumb */}
        <div 
          className={`absolute top-0 w-6 h-6 bg-beach-foam pixel-border transition-all duration-200 ${
            checked ? 'transform translate-x-6' : 'transform translate-x-0'
          }`}
        >
          <div className={`w-full h-full border-2 ${
            checked ? 'bg-beach-water border-beach-dark-rock' : 'bg-beach-sand border-beach-dark-rock'
          }`}>
            {/* On/Off indicator */}
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-2 h-2 ${checked ? 'bg-beach-foam' : 'bg-beach-dark-rock'}`}></div>
            </div>
          </div>
        </div>
      </button>
      
      {label && (
        <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">{label}</span>
      )}
    </div>
  );
}