import * as React from 'react';
import './button.css';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const buttonVariants = cva('kz-button', {
  variants: {
    variant: {
      default: 'kz-button-lime',
      secondary: 'kz-button-ink',
      outline: '',
      destructive: 'kz-button-danger',
      ghost: 'kz-button-ghost',
      link: 'kz-button-link'
    },
    size: {default: '', sm: 'kz-button-small', lg: 'kz-button-large', icon: 'kz-button-icon'}
  },
  defaultVariants: {variant: 'default', size: 'default'}
});

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
