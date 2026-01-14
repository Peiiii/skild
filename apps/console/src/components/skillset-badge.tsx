import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SkillsetBadge(props: { className?: string }): JSX.Element {
  return (
    <Badge
      variant="amber"
      className={cn('select-none', props.className)}
      title="Skillset: a pack that may install multiple skills"
    >
      Skillset
    </Badge>
  );
}

