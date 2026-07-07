import type { MouseEventHandler, ReactNode } from "react";

const buttonVariants = {
  green: "bg-accent-primary text-text-primary",
  black: "bg-button-neutral text-text-primary",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

type ButtonProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function Button({
  children,
  variant = "green",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
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
}
