import cameraDeleteIcon from "../../assets/icons/camera_delete.svg";

type CameraPreviewProps = {
  onClose?: () => void;
  onCapture?: () => void;
};

export function CameraPreview({
  onClose,
  onCapture,
}: CameraPreviewProps) {
  return (
    <section className="relative h-[642px] w-full overflow-hidden rounded-[25px] border-[3px] border-[#1FBF5A] bg-[#5A5A5A]">
      {/* 이후 이 위치에 실제 카메라 video 태그가 들어감 */}

      <button
        type="button"
        onClick={onClose}
        aria-label="촬영 화면 닫기"
        className="absolute right-[18px] top-[18px] flex h-[28px] w-[28px] items-center justify-center"
      >
        <img
          src={cameraDeleteIcon}
          alt=""
          className="h-[16px] w-[18px]"
        />
      </button>

      <button
        type="button"
        onClick={onCapture}
        aria-label="영상 촬영 시작"
        className="absolute bottom-[35px] left-1/2 h-[71px] w-[71px] -translate-x-1/2 rounded-full border-[5px] border-[#1FBF5A] bg-white"
      />
    </section>
  );
}