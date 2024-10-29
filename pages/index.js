import NavBar from "@/components/ui/navBar";
import { useSession } from "next-auth/react";
import { PaymentChart } from "@/components/ui/payment-chart";
import { TimesheetTable } from "@/components/ui/timesheet-table"; // Adjust the path if necessary

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center h-screen p-5 font-satoshi bg-white text-black">
      <NavBar />
      <div className="w-full max-w-6xl mt-10">
        {session ? (
          <>
            <h1 className="text-center text-[3rem] mb-20 font-semibold text-gray-800">
              Welcome, <span className="font-satoshi-regular">{session.user.username}</span>!
            </h1>

            <div className="grid grid-cols-2 gap-8">
              {/* Payments Chart */}
              <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <PaymentChart />
              </div>

              {/* Timesheet Table */}
              <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                {/* Render only the TimesheetTable component */}
                <TimesheetTable endpoint="/api/timesheet/get-timesheet" />
              </div>
            </div>
          </>
        ) : (
          <h2 className="mt-40 text-center text-5xl font-satoshi-regular uppercase text-gray-800">
            Welcome, Guest
          </h2>
        )}
      </div>
    </div>
  );
}