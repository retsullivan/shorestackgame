import { useEffect } from 'react';
import snail from '../assets/character_art/pink_snail_large.gif';
import happySnail from '../assets/character_art/happy_snail_large.gif';
import wave from '../assets/scenery/wave_crash_large.gif';
// Responsive sizing handled via CSS breakpoints

interface CharacterOverlayProps {
  showWave?: boolean;
  horizonPageY?: number;
  islands?: string[];
  showClimb?: boolean;
  stackTopPage?: { x: number; y: number };
  rightBasePage?: { x: number; y: number };
  stepTargetPage?: { x: number; y: number } | null;
  showHappy?: boolean;
}

export default function CharacterOverlay({ showWave = false, horizonPageY, islands = [], showClimb = false, stackTopPage, rightBasePage, stepTargetPage, showHappy = false }: CharacterOverlayProps) {
  useEffect(() => {
    // no-op placeholder to keep consistent hook ordering if props change
  }, [showClimb, stackTopPage]);
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

      {/* Snail character: default bottom-right; when climbing, move to stack top */}
      <div
        className="z-50 pointer-events-none select-none hidden md:block snail-move"
        style={{
          position: 'fixed',
          right: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? undefined : 16,
          bottom: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? undefined : 16,
          left: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? Math.round((stepTargetPage ?? stackTopPage ?? rightBasePage)!.x) : undefined,
          top: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? Math.round((stepTargetPage ?? stackTopPage ?? rightBasePage)!.y) : undefined,
          transform: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? 'translate(-50%, -100%)' : 'none',
        }}
      >
        <img
          src={showClimb || showHappy ? happySnail : snail}
          alt="Pink snail character"
          className="block h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </>
  );
}


