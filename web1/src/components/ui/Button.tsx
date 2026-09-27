import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'institutional' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  to?: string;
  href?: string;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#FF6600] hover:bg-[#E55C00] text-white font-semibold shadow-[0_1px_0_rgba(66,43,28,0.08),0_4px_12px_-2px_rgba(255,102,0,0.35)] hover:shadow-[0_1px_0_rgba(66,43,28,0.08),0_6px_16px_-2px_rgba(255,102,0,0.45)] active:translate-y-px transition-all duration-200',
  secondary:
    'bg-secondary hover:bg-secondary-container text-on-secondary font-semibold shadow-md active:translate-y-px transition-all duration-200',
  institutional:
    'bg-primary hover:bg-primary-container text-white font-semibold shadow-[0_1px_0_rgba(66,43,28,0.08),0_2px_6px_-1px_rgba(66,43,28,0.18)] active:translate-y-px transition-all duration-200',
  outline:
    'bg-transparent text-primary font-semibold border border-primary/25 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200',
  ghost:
    'bg-transparent text-primary hover:bg-primary/5 font-semibold transition-all duration-200',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-[13px] rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-[14px] rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-[14px] rounded-xl gap-2',
  xl: 'px-8 py-4 text-[15px] rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  to,
  href,
  ...props
}: ButtonProps) {
  const classes = [
    'group inline-flex items-center justify-center font-title-sm tracking-tight',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}