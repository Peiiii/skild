import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar provides a standardized pill-shaped search input.
 * Features brand-eco backgrounds and consistent focus states.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  className,
}: SearchBarProps): JSX.Element {
  return (
    <form 
      className={cn(
        "relative flex-1 group",
        "rounded-full border border-brand-forest/5 bg-brand-eco/5 transition-all duration-300",
        "focus-within:border-brand-eco/30 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-brand-eco/10",
        className
      )} 
      onSubmit={onSubmit}
    >
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-forest/20 group-focus-within:text-brand-eco transition-colors duration-300" />
      <Input
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        className="pl-14 h-14 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-brand-forest placeholder:text-brand-forest/20"
      />
      <Button
        type="submit"
        className="absolute right-2 top-2 h-10 w-10 sm:w-auto sm:px-6 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-forest/10 p-0 sm:p-auto flex items-center justify-center"
      >
        <span className="hidden sm:inline">Search</span>
        <Search className="h-4 w-4 sm:hidden" />
      </Button>
    </form>
  );
}
