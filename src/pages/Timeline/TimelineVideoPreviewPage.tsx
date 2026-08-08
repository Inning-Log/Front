//import { TimelineFriendVideoTemplate } from "../../features/timeline/components/TimelineFriendVideoTemplate";
import { TimelineMyVideoTemplate } from "../../features/timeline/components/TimelineMyVideoTemplate";

// 친구랑 함께 저장
// const myRecord = {
//   name: "민희",
//   teamName: "두산",
// };

// const friendRecord = {
//   name: "지민",
//   teamName: "한화",
//   record: {
//     id: "friend-record-1",
//     inning: 1,
//     recordedAt: "18:43",
//     homeScore: 0,
//     awayScore: 0,
//     text: "야호~~~~",
//   },
// };

// 내 영상 저장
const myVideoRecord = {
  id: "my-record-1",
  inning: 1,
  recordedAt: "18:43",
  homeScore: 1,
  awayScore: 0,
  text: "야호~~~~",
};

export function TimelineVideoPreviewPage() {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-[#2E312F] py-[40px]">
      {/* 친구랑 함께 저장 */}
      {/* <TimelineFriendVideoTemplate
        inning={1}
        myRecord={myRecord}
        friendRecord={friendRecord}
      /> */}

      {/* 내 영상 저장 */}
      <TimelineMyVideoTemplate
        inning={1}
        userName="minhee"
        teamName="두산"
        record={myVideoRecord}
      />
    </div>
  );
}