import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// 1. Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none touch-target";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-card",
    secondary: "bg-[#EAEFEA] text-main hover:bg-[#DDE5DE]",
    outline: "border border-border bg-card text-main hover:bg-[#F2F6F3]",
    ghost: "text-secondary hover:text-main hover:bg-[#EAEFEA]",
    danger: "bg-error text-white hover:bg-error-dark",
    accent: "bg-accent text-white hover:bg-accent-hover shadow-card"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base font-semibold"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// 2. Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-xs font-semibold text-main uppercase tracking-wider">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-main text-sm placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors",
            error && "border-error focus:border-error focus:ring-error",
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-secondary">{helperText}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// 3. Select
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-xs font-semibold text-main uppercase tracking-wider">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors",
            error && "border-error",
            className
          )}
          {...props}
        >
          {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// 4. Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-xs font-semibold text-main uppercase tracking-wider">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-main text-sm placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors",
            error && "border-error",
            className
          )}
          rows={3}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-secondary">{helperText}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// 5. Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: "bg-[#EAEFEA] text-secondary border border-border",
    success: "bg-accent-light text-primary border border-[#bbf7d0]",
    warning: "bg-warning-light text-warning-dark border border-[#fde68a]",
    info: "bg-info-light text-info-dark border border-[#bfdbfe]",
    error: "bg-error-light text-error-dark border border-[#fecaca]",
    outline: "bg-card text-secondary border border-border"
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};

// 6. StatusBadge
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'delivered':
      return <Badge variant="success">{status}</Badge>;
    case 'pending':
    case 'purchase request':
      return <Badge variant="warning">{status}</Badge>;
    case 'confirmed':
    case 'in transit':
    case 'open':
      return <Badge variant="info">{status}</Badge>;
    case 'sold':
    case 'expired':
    case 'rejected':
      return <Badge variant="error">{status}</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

// 7. Card
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn("bg-card border border-border rounded-card p-5 shadow-card transition-shadow hover:shadow-hover", className)}
      {...props}
    >
      {children}
    </div>
  );
};
