import snail from '../assets/character_art/pink_snail_large.gif';
import snailClimb from '../assets/character_art/pink_snail_schmoove.gif';
import wave from '../assets/scenery/wave_crash_large.gif';
// Responsive sizing handled via CSS breakpoints

interface CharacterOverlayProps {
  showWave?: boolean;
  horizonPageY?: number;
  islands?: string[];
  showClimb?: boolean;
}

export default function CharacterOverlay({ showWave = false, horizonPageY, islands = [], showClimb = false }: CharacterOverlayProps) {
  return (
    <>
      {/* Distant island scenery at horizon */}
      {horizonPageY !== undefined && islands.length > 0 && (
        <div
          className="z-0 pointer-events-none select-none hidden md:block"
          style={{ position: 'fixed', left: 0, right: 0, top: horizonPageY, transform: 'translateY(-100%)', height: 100, overflow: 'visible' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Render up to two layered islands for parallax-like depth */}
            {islands.slice(0, 2).map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={`island_${idx + 1}`}
                style={{
                  position: 'absolute',
                  left: idx === 0 ? '5%' : '55%',
                  bottom: 0,
                  imageRendering: 'pixelated',
                  width: idx === 0 ? '22vw' : '16vw',
                  height: 'auto',
                  opacity: idx === 0 ? 0.9 : 0.8,
                  filter: 'saturate(0.95) brightness(0.95)',
                }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Left-side wave overlay (temporary) */}
      {showWave && (
        <div
          className="z-50 pointer-events-none select-none hidden md:block"
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
          src={showClimb ? snailClimb : snail}
          alt="Pink snail character"
          className={`block h-auto ${showClimb ? 'snail-climb' : ''}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </>
  );
}


