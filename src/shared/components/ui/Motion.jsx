import { cn } from '@/shared/lib/utils';

const VARIANTS = {
  'fade-in':      'animate-fade-in',
  'fade-in-up':   'animate-fade-in-up',
  'fade-in-down': 'animate-fade-in-down',
  'scale-in':     'animate-scale-in',
  'pop-in':       'animate-pop-in',
};

export function FadeIn({
  variant = 'fade-in-up',
  delay,
  className,
  style,
  children,
  ...props
}) {
  const animClass = VARIANTS[variant] ?? VARIANTS['fade-in-up'];
  const merged = delay
    ? { ...style, animationDelay: typeof delay === 'number' ? `${delay}ms` : delay }
    : style;

  return (
    <div className={cn(animClass, className)} style={merged} {...props}>
      {children}
    </div>
  );
}

export function Stagger({ className, children, ...props }) {
  return (
    <div className={cn('stagger-children', className)} {...props}>
      {children}
    </div>
  );
}

export default FadeIn;
