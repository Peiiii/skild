import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-white shadow-lg shadow-primary/10",
                secondary:
                    "border-transparent bg-secondary text-white shadow-lg shadow-secondary/10",
                destructive:
                    "border-transparent bg-destructive text-white",
                outline: "text-brand-forest border-brand-forest/30 bg-brand-forest/[0.08]",
                eco: "border-transparent bg-brand-eco/20 text-brand-eco font-black shadow-sm",
                forest: "border-transparent bg-brand-forest/20 text-brand-forest font-black shadow-sm",
                amber: "border-transparent bg-amber-500/20 text-amber-600 font-black shadow-sm",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
