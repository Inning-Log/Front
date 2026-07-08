import { useNavigate } from "react-router-dom";
import backArrowIcon from "../../assets/icons/backarrow.svg";

type PageHeaderProps = {
  title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative flex h-[58px] w-full items-center justify-center px-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="뒤로가기"
        className="absolute left-5 flex h-10 w-10 items-center justify-center"
      >
        <img
          src={backArrowIcon}
          alt=""
          className="h-3 w-3"
        />
      </button>

      <h1 className="font-pretendard text-[20px] font-bold leading-normal tracking-[0px]">
        {title}
      </h1>
    </header>
  );
}