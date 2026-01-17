import * as React from 'react';

/**
 * DesignGrid provides the brand-consistent architectural background layer.
 * It features subtle grid lines and organic glows.
 */
export function DesignGrid(): JSX.Element {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Subtle Glows */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-brand-eco/10 blur-[140px] rounded-full opacity-60"
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-brand-forest/5 blur-[140px] rounded-full opacity-40"
      />

      {/* Soft Grid Layer */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,74,34,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,74,34,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
    </div>
  );
}
