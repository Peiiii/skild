import React from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillsetBadgeProps {
  className?: string;
}

export function SkillsetBadge({ className }: SkillsetBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
      "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      "shadow-[0_0_15px_rgba(99,102,241,0.1)] backdrop-blur-sm",
      "animate-in fade-in zoom-in duration-300",
      className
    )}>
      <Layers className="w-3 h-3" />
      <span>Skillset</span>
    </div>
  );
}
