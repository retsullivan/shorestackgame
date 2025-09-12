import { useEffect } from 'react';
import snail from '../assets/character_art/pink_snail_large.gif';
import happySnail from '../assets/character_art/happy_snail_cropped_large.gif';
import scaredSnail from '../assets/character_art/scared_snail_large.gif';
import sadSnail from '../assets/character_art/sad_snail_large.gif';
import wave from '../assets/scenery/wave_crash_large.gif';
import sandDaytime from '../assets/scenery/sand_daytime_large.png';
import sandSunset from '../assets/scenery/sand_sunset_large.png';
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
  onHappyLoopMs?: (ms: number) => void;
  isScared?: boolean;
  isSad?: boolean;
  variantTheme?: 'daytime' | 'sunset';
  compact?: boolean; // show on mobile in a smaller footprint
}

let CACHED_HAPPY_MS: number | null = null;

async function computeGifLoopDurationMs(url: string): Promise<number> {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let i = 0;
    if (bytes.length < 20) return 700;
    // Header + LSD
    i += 6;
    const packed = bytes[10];
    i += 7;
    if ((packed & 0x80) !== 0) {
      const gctSize = 3 * (1 << ((packed & 0x07) + 1));
      i += gctSize;
    }
    let delayHundredths = 0;
    let pendingDelay = 0;
    while (i < bytes.length) {
      const b = bytes[i++];
      if (b === 0x3B) break; // trailer
      if (b === 0x21) {
        const label = bytes[i++];
        if (label === 0xF9) {
          const blockSize = bytes[i++];
          if (blockSize === 4) {
            i++; // packed fields
            const d1 = bytes[i++];
            const d2 = bytes[i++];
            pendingDelay = d1 + (d2 << 8);
            i++; // transparent index
            i++; // terminator
          } else {
            i += blockSize;
            while (bytes[i++] !== 0) { /* skip */ }
          }
        } else {
          // skip generic extension data sub-blocks
          while (true) { const sz = bytes[i++]; if (sz === 0) break; i += sz; }
        }
      } else if (b === 0x2C) {
        // image descriptor
        const packedImg = bytes[i + 8];
        i += 9;
        if ((packedImg & 0x80) !== 0) {
          const lctSize = 3 * (1 << ((packedImg & 0x07) + 1));
          i += lctSize;
        }
        i++; // LZW min code size
        while (true) { const sz = bytes[i++]; if (sz === 0) break; i += sz; }
        delayHundredths += (pendingDelay || 10); // default 100ms if unspecified
        pendingDelay = 0;
      } else {
        // Unknown block; bail
        break;
      }
    }
    return Math.max(200, delayHundredths * 10);
  } catch {
    return 700;
  }
}

export default function CharacterOverlay({ showWave = false, horizonPageY, islands = [], showClimb = false, stackTopPage, rightBasePage, stepTargetPage, showHappy = false, onHappyLoopMs, isScared = false, isSad = false, variantTheme = 'daytime', compact = false }: CharacterOverlayProps) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (onHappyLoopMs) {
        if (CACHED_HAPPY_MS == null) {
          CACHED_HAPPY_MS = await computeGifLoopDurationMs(happySnail);
        }
        if (mounted) onHappyLoopMs(CACHED_HAPPY_MS);
      }
    })();
    return () => { mounted = false; };
  }, [onHappyLoopMs]);
  return (
    <>
      {/* Bottom sand graphic, repeats horizontally */}
      <div
        className="z-10 pointer-events-none select-none hidden md:block"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom:45,
          height: 60,
          backgroundImage: `url(${variantTheme === 'sunset' ? sandSunset : sandDaytime})`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
          backgroundSize: 'auto 100%',
          imageRendering: 'pixelated',
        }}
      />
      <div
        className="z-10 pointer-events-none select-none hidden md:block"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          backgroundImage: `url(${variantTheme === 'sunset' ? sandSunset : sandDaytime})`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
          backgroundSize: 'auto 100%',
          imageRendering: 'pixelated',
        }}
      />
      
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
        className={`z-50 pointer-events-none select-none ${compact ? 'block' : 'hidden md:block'} snail-move`}
        style={{
          position: 'fixed',
          right: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? undefined : (compact ? 8 : 16),
          bottom: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? undefined : (compact ? 'calc(env(safe-area-inset-bottom, 0px) + 28px)' : 16),
          left: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? Math.round((stepTargetPage ?? stackTopPage ?? rightBasePage)!.x) : undefined,
          top: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? Math.round((stepTargetPage ?? stackTopPage ?? rightBasePage)!.y) : undefined,
          transform: showClimb && (stackTopPage || rightBasePage || stepTargetPage) ? 'translate(-50%, -100%)' : 'none',
        }}
      >
        <img
          src={showClimb || showHappy ? happySnail : (isSad ? sadSnail : (isScared ? scaredSnail : snail))}
          alt="Pink snail character"
          className="block h-auto"
          style={{ imageRendering: 'pixelated', width: compact ? 176 : undefined }}
        />
      </div>
    </>
  );
}


