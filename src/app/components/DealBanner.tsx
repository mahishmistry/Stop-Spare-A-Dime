import { Clock } from 'lucide-react';

interface DealBannerProps {
  title: string;
  description: string;
  timeLeft: string;
  color?: string;
}

export function DealBanner({ title, description, timeLeft, color = '#6FBD7A' }: DealBannerProps) {
  return (
    <div
      className="rounded-xl p-6 text-white relative overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <div className="relative z-10">
        <h2 className="mb-2">{title}</h2>
        <p className="text-sm opacity-90 mb-4">{description}</p>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span>Ends in {timeLeft}</span>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-10 rounded-full"></div>
    </div>
  );
}
