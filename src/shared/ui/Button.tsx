import type { MouseEventHandler, ReactNode } from "react";

const buttonVariants = {
  green: "bg-brand-light text-text-inverse active:bg-brand-default",
  black: "bg-text-primary text-text-inverse active:bg-text-tertiary",
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
        "transition-colors duration-150",
        buttonVariants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      <span className="button-text flex h-full w-full items-center justify-center px-[51px] pt-5">
        {children}
      </span>
    </button>
  );
}
