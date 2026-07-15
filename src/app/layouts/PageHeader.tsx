import { useNavigate } from "react-router-dom";

import backArrowIcon from "../../assets/icons/backarrow.svg";

type PageHeaderProps = {
  title?: string;
  rightText?: string;
  rightTo?: string;
  onRightClick?: () => void;
};

export function PageHeader({
  title = "",
  rightText = "",
  rightTo = "",
  onRightClick,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const hasRightButton = Boolean(rightTo || onRightClick);

  const handleRightClick = () => {
    if (onRightClick) {
      onRightClick();
      return;
    }

    if (rightTo) {
      navigate(rightTo);
    }
  };

  return (
    <header className="relative flex h-[46px] w-full items-center justify-center px-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-3 flex h-10 w-10 items-center justify-center"
      >
        <img src={backArrowIcon} alt="" className="h-[18.5px] w-[9px]" />
      </button>

      <h1 className="text-label-1 max-w-[calc(100%-160px)] truncate text-black">
        {title}
      </h1>

      {rightText &&
        (hasRightButton ? (
          <button
            type="button"
            onClick={handleRightClick}
            className="text-label-4 absolute right-5 min-w-0 max-w-[100px] truncate text-text-secondary"
          >
            {rightText}
          </button>
        ) : (
          <span className="text-label-3 absolute right-5 min-w-0 max-w-[100px] truncate text-text-secondary">
            {rightText}
          </span>
        ))}
    </header>
  );
}