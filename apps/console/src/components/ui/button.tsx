import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] hover:scale-[1.02]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-xl shadow-primary/10 hover:bg-primary/95',
        secondary: 'bg-secondary text-white shadow-lg shadow-secondary/10 hover:bg-secondary/95',
        outline: 'border border-primary/10 bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:text-primary hover:border-primary/20',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-primary/5 hover:text-primary'
      },
      size: {
        default: 'h-11 px-8 py-2',
        sm: 'h-9 px-4 text-xs font-bold leading-none',
        lg: 'h-14 px-12 text-base shadow-2xl shadow-primary/20',
        icon: 'h-11 w-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

