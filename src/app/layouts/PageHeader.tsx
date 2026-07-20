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
        aria-label="이전 화면으로 이동"
        className="absolute left-3 flex h-10 w-10 items-center justify-center"
      >
        <img
          src={backArrowIcon}
          alt=""
          className="h-[25px] w-[12.5px]"
        />
      </button>

      <h1 className="text-input max-w-[calc(100%-160px)] truncate text-black">
        {title}
      </h1>

      {rightText &&
        (hasRightButton ? (
          <button
            type="button"
            onClick={handleRightClick}
            className="absolute right-5 max-w-[100px] truncate font-pretendard text-[14px] font-medium leading-[140%] tracking-[0.28px] text-text-secondary"
          >
            {rightText}
          </button>
        ) : (
          <span className="absolute right-5 max-w-[100px] truncate font-pretendard text-[14px] font-medium leading-[140%] tracking-[0.28px] text-text-secondary">
            {rightText}
          </span>
        ))}
    </header>
  );
}