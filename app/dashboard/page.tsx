import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board } from "@/lib/models";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import KanbanBoard from "@/components/KanbanBoardClient";

async function getBoard(userId: string) {
  "use cache";

  await connectDB();

  const boardDoc = await Board.findOne({
    userId: userId,
    name: "Job Hunt",
  }).populate({
    path: "columns",
    populate: {
      path: "jobApplications",
    },
  });

  if (!boardDoc) return null;

  const board = JSON.parse(JSON.stringify(boardDoc));

  return board;
}

async function DashboardPage() {
  const session = await getSession();
  const board = await getBoard(session?.user.id ?? "");

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
            Job Hunt
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Track your job applications
          </p>
        </div>

        {/* Responsive horizontal scroll for kanban */}
        <div className="w-full overflow-x-auto">
          <KanbanBoard board={board} userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<p className="p-4 text-sm sm:text-base">Loading...</p>}>
      <DashboardPage />
    </Suspense>
  );
}