import React, {type ButtonHTMLAttributes, forwardRef} from 'react'
import {Slot} from '@radix-ui/react-slot'
import {cva, type VariantProps} from 'class-variance-authority'
import {cn} from '../../lib/cn'

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-[4px] font-semibold transition-all duration-100 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
    {
        variants: {
            variant: {
                default: 'bg-transparent text-inherit hover:text-foreground/80',
                filled: 'bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary/90',
                danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/80 active:bg-destructive/90',
                primary: 'bg-primary text-primary-foreground hover:bg-primary/80',
                secondary: 'border border-primary text-primary hover:bg-primary/10 active:bg-primary/20',
                tertiary: 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/20',
                quaternary: 'bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20',
                gray: 'bg-transparent text-foreground/60 hover:bg-foreground/10 hover:text-foreground/80',
                link: 'bg-transparent text-primary hover:underline',
            },
            size: {
                xsmall: 'h-6 px-2.5 text-xs',
                small: 'h-8 px-4 text-xs',
                medium: 'h-10 px-5 text-sm',
                large: 'h-12 px-6 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'medium',
        },
    }
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    filled?: boolean
    danger?: boolean
    emphasis?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'gray' | 'default' | 'link'
    active?: boolean
    icon?: React.ReactNode
    rightIcon?: boolean
    asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, filled, danger, emphasis, size = 'medium', active, icon, rightIcon, asChild, children, ...props}, ref) => {
        const Comp = asChild ? Slot : 'button'

        let variant: string = emphasis ?? 'default'
        if (filled) variant = 'filled'
        if (danger) variant = 'danger'

        return (
            <Comp
                ref={ref as React.Ref<HTMLButtonElement>}
                className={cn(
                    buttonVariants({variant: variant as Parameters<typeof buttonVariants>[0]['variant'], size}),
                    active && 'bg-primary/10 text-primary',
                    className
                )}
                {...props}
            >
                {!rightIcon && icon && <span className={cn('inline-flex', children ? 'mr-2' : '')}>{icon}</span>}
                {children}
                {rightIcon && icon && <span className={cn('inline-flex', children ? 'ml-2' : '')}>{icon}</span>}
            </Comp>
        )
    }
)

Button.displayName = 'Button'

export {Button, buttonVariants}
