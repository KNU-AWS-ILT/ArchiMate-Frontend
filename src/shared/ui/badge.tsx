import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2 py-0.5 text-cap font-semibold',
    {
        variants: {
            tone: {
                neutral: 'bg-surface-2 text-muted',
                accent: 'bg-accent-soft text-accent-text',
                success: 'bg-success-soft text-success',
                warn: 'bg-warn-bg text-warn-text',
                danger: 'bg-danger-soft text-danger-text',
            },
        },
        defaultVariants: { tone: 'neutral' },
    },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, className, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
