import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export function Header({ title, subtitle, onBack }: HeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col mb-4 w-full">
        <div className="flex justify-start mb-2">
          <Button
            onClick={onBack}
            className="retro-button pixel-font text-beach-foam w-8 h-8 p-0 hover:scale-105 transition-transform flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={5} />
          </Button>
        </div>
        <div className="w-full text-right">
          <h1 className="pixel-font text-sm text-beach-foam mt-1">{title}</h1>
          {subtitle && (
            <p className="pixel-font text-xs text-beach-foam mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-8 w-full">
      <Button
        onClick={onBack}
        className="retro-button pixel-font text-beach-foam w-12 h-12 p-0 hover:scale-105 transition-transform flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={5} />
      </Button>
      <div className="text-right">
        <h1 className="pixel-font text-3xl text-beach-foam">{title}</h1>
        {subtitle && (
          <p className="pixel-font text-base text-beach-foam">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
