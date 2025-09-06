import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export function Header({ title, subtitle, onBack }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 md:mb-8">
      <Button
        onClick={onBack}
        className="retro-button pixel-font text-beach-foam mr-8 md:mr-10 w-10 h-10 md:w-12 md:h-12 p-0 hover:scale-105 transition-transform"
      >
        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" strokeWidth={5} />
      </Button>
      <div className="ml-4">
        <h1 className="pixel-font text-xl md:text-4xl text-beach-foam">{title}</h1>
        {subtitle && (
          <p className="pixel-font text-xs md:text-sm text-beach-foam mt-1 md:mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
