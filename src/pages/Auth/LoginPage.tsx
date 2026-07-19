import { PageHeader } from "../../app/layouts/PageHeader";
import googleIcon from "../../assets/icons/google.svg";
import { Button } from "../../shared/ui/Button";

export function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg-primary pt-[28.5px]">
      <PageHeader />

      <main className="flex flex-1 flex-col px-[33px]">
        <h1 className="text-title-2 mt-[62px] whitespace-pre-line text-black">
          {"야구의 특별한 순간들을\n기록해볼까요?"}
        </h1>

        <div className="mt-auto pb-[49px]">
          <Button variant="black" className="h-13.75 w-full">
            <img src={googleIcon} alt="" className="h-8.75 w-8.75" />
            <span className="ml-[11px] text-label-2">
              구글로 계속하기
            </span>
          </Button>

          <p className="mt-[11px] text-center text-caption text-black">
            로그인 오류시 문의 inning@inning.net
          </p>
        </div>
      </main>
    </div>
  );
}
