import { forwardRef } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

const buttonVariants = {
  green: "bg-accent-primary text-text-primary",
  black: "bg-button-neutral text-text-primary",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

type ButtonProps = ComponentPropsWithRef<"button"> & {
  children?: ReactNode;
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "green", className = "", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          "flex h-[55px] w-[358px] items-center justify-center rounded-[27.5px]",
          buttonVariants[variant],
          className,
        ].join(" ")}
        {...props}
      >
        <span className="button-text flex h-full w-full items-center justify-center">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
