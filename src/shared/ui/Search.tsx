import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";

import searchIcon from "../../assets/icons/search-gray.svg";

type SearchProps = ComponentPropsWithRef<"input">;

export const Search = forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className = "",
      placeholder = "검색하기",
      type = "text",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={["w-full", className].join(" ")}>
        <label className="relative flex h-[43px] w-full items-center overflow-hidden rounded-[15px] bg-surface-secondary px-[13px]">
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            className="text-label-3 min-w-0 flex-1 bg-transparent pr-[30px] text-black placeholder:text-text-placeholder focus:outline-none"
            {...props}
          />
          <img
            src={searchIcon}
            alt=""
            className="absolute right-[13px] h-[20px] w-[20px]"
          />
        </label>

        <div className="mt-[6px] h-px w-full bg-surface-secondary" />
      </div>
    );
  },
);

Search.displayName = "Search";
