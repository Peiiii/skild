import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: React.ReactNode;
  copyValue?: string;
  className?: string;
  innerClassName?: string;
}

/**
 * CodeBlock provides a standardized terminal-style display for commands and output.
 * It features the brand-eco left accent and consistent "Eco-Premium" padding.
 */
export function CodeBlock({ 
  children, 
  copyValue, 
  className,
  innerClassName 
}: CodeBlockProps): JSX.Element {
  const [copied, setCopied] = React.useState(false);

  async function onCopy(): Promise<void> {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("relative group", className)}>
      <div className={cn(
        "rounded-[24px] bg-brand-forest border border-brand-forest/5 p-8 font-mono text-sm text-white shadow-2xl shadow-brand-forest/10 overflow-hidden relative",
        copyValue && "pr-16",
        innerClassName
      )}>
        {/* Brand accent left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-eco" />
        
        <div className="relative">
          {children}
        </div>
      </div>

      {copyValue && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95 z-20"
          onClick={() => void onCopy()}
        >
          {copied ? <Check className="h-5 w-5 text-brand-eco" /> : <Copy className="h-5 w-5" />}
        </Button>
      )}
    </div>
  );
}
