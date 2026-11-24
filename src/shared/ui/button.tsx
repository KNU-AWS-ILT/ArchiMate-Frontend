import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sub font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    {
        variants: {
            variant: {
                primary: 'bg-accent text-on-accent hover:bg-accent-hover',
                secondary: 'border border-border bg-surface text-text hover:bg-surface-2',
                danger: 'bg-danger text-on-accent hover:bg-danger-hover',
            },
        },
        defaultVariants: { variant: 'primary' },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ variant, className, type = 'button', ...props }: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
