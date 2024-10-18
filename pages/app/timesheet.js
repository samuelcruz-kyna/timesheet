import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { useFormik } from 'formik';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import NavBar from '@/components/ui/navBar';

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
    <div className="flex flex-col items-center bg-[var(--background)] text-[var(--foreground)] min-h-screen w-full font-helvetica">
      <NavBar />

      <div className="mt-24 w-full max-w-4xl px-6">
        <h1 className="text-center text-5xl font-extrabold uppercase text-[var(--foreground)] mb-8">Daily Timesheet</h1>

        {lastAction === 'TIME_OUT' ? (
          <p className="text-xl text-white mb-8 text-center">
            You have logged a total of <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> hours today.
          </p>
        ) : lastAction === 'BREAK' ? (
          <p className="text-xl text-white mb-8 text-center">
            You have worked for <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> so far. Ready to resume?
          </p>
        ) : lastAction === 'TIME_IN' ? (
          <p className="text-xl text-white mb-8 text-center">
            Your timer is active. Click <b>Break</b> to pause or <b>Time Out</b> to stop.
          </p>
        ) : (
          <p className="text-xl text-white mb-8 text-center">
            Click <b>Time In</b> to start tracking your work hours.
          </p>
        )}

        {/* Summary Table */}
        <div className="p-5 rounded-xl border border-gray-700 mb-10">
          <Table className="min-w-full">
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
            <TableBody>
              {dailySummaries.length > 0 ? (
                dailySummaries.map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell>{summary.fullName}</TableCell>
                    <TableCell>{convertDateToLocal(summary.date)}</TableCell>
                    <TableCell>{calculateDuration(summary.timeSpan)}</TableCell> {/* Display calculated duration */}
                    <TableCell>{convertTimeSpanToLocal(summary.timeSpan)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    You have no records for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Time In/Out/Break Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-row justify-between items-center p-5 rounded-xl border border-gray-700">
          <Button
            variant="default"
            type="button"
            className="p-3 bg-transparent border border-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300"
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
            className="p-3 bg-transparent border border-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300"
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
            className="p-3 bg-transparent border border-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300"
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

// Helper function to calculate the duration between timeIn and timeOut
function calculateDuration(timeSpan) {
  if (!timeSpan) return "00:00:00";
  
  const [startTimeUTC, endTimeUTC] = timeSpan.split(' to ').map((time) => time.trim());
  if (!endTimeUTC) return "00:00:00";

  const startTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`);
  const endTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}Z`);

  const durationInSeconds = (endTime - startTime) / 1000; // Calculate duration in seconds
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
