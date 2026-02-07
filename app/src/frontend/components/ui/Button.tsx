import React, {type ButtonHTMLAttributes, forwardRef} from 'react'
import {cn} from '../../lib/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    filled?: boolean
    danger?: boolean
    emphasis?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'gray' | 'default' | 'link'
    size?: 'xsmall' | 'small' | 'medium' | 'large'
    active?: boolean
    icon?: React.ReactNode
    rightIcon?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, filled, danger, emphasis, size = 'medium', active, icon, rightIcon, children, ...props}, ref) => {

        const variants = {
            base: "inline-flex items-center justify-center rounded-[4px] font-semibold transition-all duration-100 ease-out focus:outline-none focus:ring-2 focus:ring-button-bg focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",

            size: {
                xsmall: "h-6 px-2.5 text-xs",
                small: "h-8 px-4 text-xs",
                medium: "h-10 px-5 text-sm",
                large: "h-12 px-6 text-base",
            },

            filled: "bg-button-bg text-button-fg hover:bg-button-bg/80 active:bg-button-bg/90",
            danger: "bg-button-danger text-white hover:bg-button-danger/80 active:bg-button-danger/90",

            emphasis: {
                primary: "bg-button-bg text-button-fg hover:bg-button-bg/80",
                secondary: "border border-button-bg text-button-bg hover:bg-button-bg/10 active:bg-button-bg/20",
                tertiary: "bg-button-bg/10 text-button-bg hover:bg-button-bg/20 active:bg-button-bg/20",
                quaternary: "bg-transparent text-button-bg hover:bg-button-bg/10 active:bg-button-bg/20",
                gray: "bg-transparent text-center-fg/60 hover:bg-center-fg/10 hover:text-center-fg/80",
                default: "bg-transparent text-inherit hover:text-center-fg/80",
                link: "bg-transparent text-button-bg hover:underline",
            }
        }

        let variantClass = variants.emphasis.default;
        if (filled) variantClass = variants.filled;
        if (danger) variantClass = variants.danger;
        if (emphasis && variants.emphasis[emphasis]) variantClass = variants.emphasis[emphasis];

        if (filled) variantClass = variants.filled;
        if (danger && filled) variantClass = variants.danger;

        return (
            <button
                ref={ref}
                className={cn(
                    variants.base,
                    variants.size[size],
                    variantClass,
                    active && "bg-button-bg/10 text-button-bg",
                    className
                )}
                {...props}
            >
                {!rightIcon && icon && <span className={cn("inline-flex", children ? "mr-2" : "")}>{icon}</span>}
                {children}
                {rightIcon && icon && <span className={cn("inline-flex", children ? "ml-2" : "")}>{icon}</span>}
            </button>
        )
    }
)

Button.displayName = "Button"

export {Button}
