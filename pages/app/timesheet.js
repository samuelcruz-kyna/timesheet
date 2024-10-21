import { useState, useEffect, useCallback } from "react"; 
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { useFormik } from 'formik';
import { Poppins } from 'next/font/google';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NavBar from '@/components/ui/navBar';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '900'],
});

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); 
  const [dailySummaries, setDailySummaries] = useState([]); 
  const [loading, setLoading] = useState(true); 

  const [isTimeInLoading, setIsTimeInLoading] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [isTimeOutLoading, setIsTimeOutLoading] = useState(false);

  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      try {
        const res = await fetch('/api/timesheet/summary');
        const data = await res.json();
        setLastAction(data.lastAction || ''); 
        setDailySummaries(data.dailySummaries || []); 
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
        setLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]);

  const formik = useFormik({
    initialValues: {
      action: '',
    },
    onSubmit: async (values) => {
      try {
        if (!session && status !== 'loading') {
          console.error("No session found");
          return;
        }
        const res = await fetch('/api/timesheet/insert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: values.action,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Failed to log timesheet', errorData);
          return;
        }

        await fetchTimesheetData();
      } catch (error) {
        console.error('Error submitting timesheet:', error);
      }
    },
  });

  const isTimeInDisabled = lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';
  const isInitialState = lastAction === '';

  if (loading) {
    return <p className="text-center text-[1.25rem] font-black mt-96">Loading Timesheets...</p>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />
      <h1 className="text-center text-5xl font-extrabold uppercase mt-24 mb-12">Daily Timesheet</h1>

      <div className="container mx-auto p-8 rounded-xl border border-gray-700">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailySummaries.length > 0 ? (
              dailySummaries.map((summary, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{summary.fullName}</TableCell>
                  <TableCell>{convertDateToLocal(summary.date)}</TableCell>
                  <TableCell>{summary.totalTime}</TableCell> {/* Maintaining original duration logic */}
                  <TableCell>{convertTimeSpanToLocal(summary.timeSpan)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center pt-10 pb-5">
                  You have no records for today.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Duration Display */}
      {lastAction === 'TIME_OUT' ? (
        <p className={`${poppins.className} text-xl text-center mt-8`}>
          You have logged a total of <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> hours today.
        </p>
      ) : lastAction === 'BREAK' ? (
        <p className={`${poppins.className} text-xl text-center mt-8`}>
          You have worked for <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> so far.
        </p>
      ) : lastAction === 'TIME_IN' ? (
        <p className={`${poppins.className} text-xl text-center mt-8`}>
          Your timer is active. Click <b>Break</b> to pause or <b>Time Out</b> to stop.
        </p>
      ) : (
        <p className={`${poppins.className} text-xl text-center mt-8`}>
          Click <b>Time In</b> to start tracking your work hours.
        </p>
      )}

      {/* Time In/Out/Break Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-row justify-center items-center gap-5 p-5 rounded-lg mt-10 w-full max-w-6xl"
      >
        <Button
          variant="default"
          type="button"
          className="p-3 w-full bg-[var(--dark-grey)] text-white rounded-md hover:bg-gradient-to-r from-blue-400 to-purple-600 transition-colors duration-300 border border-white hover:border-black"
          onClick={async () => {
            setIsTimeInLoading(true);
            await formik.setFieldValue('action', 'TIME_IN');
            await formik.submitForm();
            setIsTimeInLoading(false);
          }}
          disabled={isTimeInLoading || (!isInitialState && isTimeInDisabled)}
        >
          {isTimeInLoading ? 'Processing...' : 'Time In'}
        </Button>

        <Button
          variant="default"
          type="button"
          className="p-3 w-full bg-[var(--dark-grey)] text-white rounded-md hover:bg-gradient-to-r from-green-400 to-teal-600 transition-colors duration-300 border border-white hover:border-black"
          onClick={async () => {
            setIsBreakLoading(true);
            await formik.setFieldValue('action', 'BREAK');
            await formik.submitForm();
            setIsBreakLoading(false);
          }}
          disabled={isBreakLoading || isBreakDisabled}
        >
          {isBreakLoading ? 'Processing...' : 'Break'}
        </Button>

        <Button
          variant="default"
          type="button"
          className="p-3 w-full bg-[var(--dark-grey)] text-white rounded-md hover:bg-gradient-to-r from-red-400 to-pink-600 transition-colors duration-300 border border-white hover:border-black"
          onClick={async () => {
            setIsTimeOutLoading(true);
            await formik.setFieldValue('action', 'TIME_OUT');
            await formik.submitForm();
            setIsTimeOutLoading(false);
          }}
          disabled={isTimeOutLoading || isTimeOutDisabled}
        >
          {isTimeOutLoading ? 'Processing...' : 'Time Out'}
        </Button>
      </form>
    </div>
  );
}

// Helper functions to convert UTC to local time and date
function convertTimeSpanToLocal(timeSpan) {
  if (!timeSpan) return 'N/A';
  const [startTimeUTC, endTimeUTC] = timeSpan.split(' to ').map((time) => time.trim());

  const localStartTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!endTimeUTC) {
    return localStartTime;
  }

  const localEndTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${localStartTime} to ${localEndTime}`;
}

function convertTo24HourFormat(timeString) {
  if (!timeString.includes(' ')) return "00:00:00";

  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function convertDateToLocal(utcDateString) {
  if (!utcDateString) return 'Invalid Date';
  const utcDate = new Date(utcDateString);
  return utcDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}
