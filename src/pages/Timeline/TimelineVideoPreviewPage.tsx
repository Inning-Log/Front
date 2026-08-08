import {
  TimelineFriendVideoTemplate,
} from "../../features/timeline/components/TimelineFriendVideoTemplate";


//기록 없는 경우
const myRecord = {
  name: "민희",
  teamName: "두산",
};

// const myRecord = {
//   name: "민희",
//   teamName: "두산",
//   record: {
//     id: "my-record-1",
//     inning: 1,
//     recordedAt: "18:43",
//     homeScore: 0,
//     awayScore: 0,
//     text: "야호~~~~",
//   },
// };

const friendRecord = {
  name: "지민",
  teamName: "한화",
  record: {
    id: "friend-record-1",
    inning: 1,
    recordedAt: "18:43",
    homeScore: 0,
    awayScore: 0,
    text: "야호~~~~",
  },
};

export function TimelineVideoPreviewPage() {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-[#2E312F] py-[40px]">
      <TimelineFriendVideoTemplate
        inning={1}
        myRecord={myRecord}
        friendRecord={friendRecord}
      />
    </div>
  );
}