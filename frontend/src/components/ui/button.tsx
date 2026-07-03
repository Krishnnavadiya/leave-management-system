import * as React from "react"
import { cn } from "../../utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 duration-100",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90": variant === 'default',
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/95": variant === 'destructive',
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground": variant === 'outline',
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80": variant === 'secondary',
            "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
            "text-primary underline-offset-4 hover:underline": variant === 'link',
          },
          {
            "h-9 px-4 py-2": size === 'default',
            "h-8 rounded-md px-3 text-xs": size === 'sm',
            "h-10 rounded-md px-8": size === 'lg',
            "h-9 w-9": size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
