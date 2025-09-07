import snail from '../assets/character_art/pink_snail_large.gif';
import wave from '../assets/scenery/wave_crash_large.gif';
// Responsive sizing handled via CSS breakpoints

interface CharacterOverlayProps {
  showWave?: boolean;
}

export default function CharacterOverlay({ showWave = false }: CharacterOverlayProps) {
  return (
    <>
      {/* Left-side wave overlay (temporary) */}
      {showWave && (
        <div
          className="z-40 pointer-events-none select-none hidden md:block"
          style={{ position: 'fixed', left: 0, bottom: -90 }}
        >
          <img
            src={wave}
            alt="Wave crash"
            className="block h-auto wave-surge"
            style={{ imageRendering: 'pixelated', width: '90vw', height: 'auto' }}
          />
        </div>
      )}

      {/* Right-side character */}
      <div
        className="z-50 pointer-events-none select-none hidden md:block"
        style={{ position: 'fixed', right: 16, bottom: 16 }}
      >
        <img
          src={snail}
          alt="Pink snail character"
          className="block h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </>
  );
}


