import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

/**
 * PageHero provides a standardized header for console pages.
 * Follows the "Eco-Premium" aesthetic with serif titles and brand colors.
 */
export function PageHero({
  title,
  description,
  actions,
  className,
  titleClassName,
}: PageHeroProps): JSX.Element {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12", className)}>
      <div className="space-y-4 max-w-2xl">
        <h1 className={cn("text-4xl md:text-5xl font-serif font-bold tracking-tight text-brand-forest", titleClassName)}>
          {title}
        </h1>
        {description && (
          <p className="text-lg md:text-xl text-brand-forest/80 font-medium italic">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
}
