import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";

type InputProps = ComponentPropsWithRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      placeholder = "",
      type = "text",
      ...props
    },
    ref,
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={[
          "h-[40px] w-[322px] border-0 border-b-2 border-accent-primary bg-transparent",
          "text-input text-black",
          "placeholder:text-text-placeholder focus:outline-none",
          className,
        ].join(" ")}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
