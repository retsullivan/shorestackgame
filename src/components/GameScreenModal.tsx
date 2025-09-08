import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import neutral_snail from "../assets/character_art/pink_snail_still_large.png";
import happy_snail from "../assets/character_art/happy_snail_cropped_large.gif";
import sad_snail from "../assets/character_art/sad_snail_still.png";


interface GoalModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	levelNumber: number;
	goalText: string;
	tip: string;
	isTimed: boolean;
	startingTime: number | null;
	onStart: () => void;
}

export function GoalModal({ open, onOpenChange, levelNumber, goalText, tip,isTimed, startingTime, onStart }: GoalModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideClose className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
				<DialogHeader className="flex flex-row justify-center">
					<DialogTitle className="pixel-font">LEVEL {String(levelNumber)} GOAL</DialogTitle>
				</DialogHeader>
				<div className="flex flex-row justify-center">
					<img src={neutral_snail} alt="Snail" className="w-16 md:w-28 pointer-events-none select-none" style={{ imageRendering: 'pixelated' }} />
				</div>
				<div className="flex flex-col">
				<div className="pixel-font text-sm">{goalText}</div>
				{tip && (<br />)}
				{tip && (<div className="pixel-font text-xs mt-3 mb-3">{tip}</div>)}
				{isTimed && (
					<div className="pixel-font text-xs mt-2">You have {startingTime ?? 0}s. The timer starts when you press START.</div>
				)}
				</div>
				<DialogFooter className="w-full">
					<div className="flex w-full items-center justify-end gap-2">
						<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={onStart}>START</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface WinModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	levelNumber: number;
	isTimed: boolean;
	timeLeft: number | null;
	onLevels: () => void;
	onReplay: () => void;
	onNext: () => void;
}

export function WinModal({ open, onOpenChange, levelNumber, isTimed, timeLeft, onLevels, onReplay, onNext }: WinModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideClose className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
				<DialogHeader className="flex flex-row justify-center">
					<DialogTitle className="pixel-font">LEVEL {String(levelNumber)} COMPLETED!</DialogTitle>
				</DialogHeader>
				<div className="flex flex-row justify-center">
					<img src={happy_snail} alt="Snail" className="center w-16 pointer-events-none select-none" style={{ imageRendering: 'pixelated' }} />
				</div>
				<div className="pixel-font text-sm">{isTimed ? `Finished with ${timeLeft ?? 0}s left.` : ``}</div>
				<DialogFooter className="w-full">
					<div className="flex w-full items-center justify-between gap-2">
						<div>
							<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm inline-flex items-center gap-2" onClick={onLevels}>
								<ArrowLeft className="w-4 h-4" />
								LEVELS
							</Button>
						</div>
						<div className="flex gap-2">
							<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={onNext}>NEXT</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface FailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isTimed: boolean;
	onLevels: () => void;
	onRetry: () => void;
}

export function FailModal({ open, onOpenChange, isTimed, onLevels, onRetry }: FailModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideClose className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
				<DialogHeader className="flex flex-row justify-center">
					<DialogTitle className="pixel-font">TRY AGAIN?</DialogTitle>
				</DialogHeader>
				<div className="flex flex-row justify-center">
					<img src={sad_snail} alt="Snail" className="center w-16 md:w-28 pointer-events-none select-none" style={{ imageRendering: 'pixelated' }} />
				</div>
				<div className="pixel-font text-sm">{isTimed ? `Time's up!` : `Challenge not met.`}</div>
				<DialogFooter className="w-full">
					<div className="flex w-full items-center justify-between gap-2">
						<div>
							<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm inline-flex items-center gap-2" onClick={onLevels}>
								<ArrowLeft className="w-4 h-4" />
								LEVELS
							</Button>
						</div>
						<div className="flex gap-2">
							<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={onRetry}>RETRY</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


interface PauseModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isTimed: boolean;
	timeLeft: number | null;
	onResume: () => void;
	onRestart: () => void;
}

export function PauseModal({ open, onOpenChange, isTimed, timeLeft, onResume, onRestart }: PauseModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideClose className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
				<DialogHeader className="flex flex-row justify-center">
					<DialogTitle className="pixel-font">PAUSED</DialogTitle>
				</DialogHeader>
				<div className="flex flex-row justify-center">
					<img src={neutral_snail} alt="Snail" className="center w-16 md:w-28 pointer-events-none select-none" style={{ imageRendering: 'pixelated' }} />
				</div>
				<div className="pixel-font text-sm">{isTimed ? `Time left: ${timeLeft ?? 0}s` : `Take a breather.`}</div>
				<DialogFooter className="w-full">
					<div className="flex w-full items-center justify-end gap-2">
						<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={onRestart}>RESTART</Button>
						<Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={onResume}>RESUME</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


