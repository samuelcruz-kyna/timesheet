import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { useFormik } from 'formik';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NavBar from '@/components/ui/navBar';
import * as XLSX from "xlsx"; // Import xlsx library

export default function Timesheet() {
  const { data: session, status } = useSession();

  // Define state variables
  const [lastAction, setLastAction] = useState('');
  const [dailySummaries, setDailySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null); // State for success/error message

  // Loading states for actions
  const [isTimeInLoading, setIsTimeInLoading] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [isTimeOutLoading, setIsTimeOutLoading] = useState(false);

  const fileInputRef = useRef(null);

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
    initialValues: { action: '' },
    onSubmit: async (values) => {
      try {
        if (!session && status !== 'loading') {
          console.error("No session found");
          return;
        }
        const res = await fetch('/api/timesheet/insert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: values.action }),
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

  // Function to handle file import
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const processFile = async (file) => {
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null); // Clear previous messages

    // Validate if the uploaded file is an Excel file
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      setIsImporting(false);
      return;
    }
    setError(null); // Clear any previous error

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      try {
        // Send imported data to backend for processing
        const response = await fetch('/api/timesheet/insert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: jsonData })
        });

        const result = await response.json();
        if (response.ok) {
          setImportMessage("Import successful");
          await fetchTimesheetData(); // Refresh table data
        } else {
          setImportMessage(`Import error: ${result.message}`);
        }
      } catch (err) {
        console.error("Error during import:", err);
        setImportMessage("Import failed. Please try again.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag-and-drop event handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    processFile(file);
  };

  // Function to open the file dialog
  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  // Function to export the timesheet data to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dailySummaries.map((summary, index) => ({
      ID: index + 1,
      "Employee Name": summary.fullName,
      Date: convertDateToLocal(summary.date),
      Duration: summary.totalTime,
      "Time Span": convertTimeSpanToLocal(summary.timeSpan),
      "Created At": convertDateToLocal(summary.createdAt),
      "Updated At": convertDateToLocal(summary.updatedAt),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");

    // Save the file
    XLSX.writeFile(wb, "Timesheet.xlsx");
  };

  // Define disabled button states
  const isTimeInDisabled = lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';
  const isInitialState = lastAction === '';

  if (loading) {
    return <p className="text-center text-[1.25rem] font-black mt-96">Loading Timesheets...</p>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-satoshi-regular">
      <NavBar />
      <h1 className="text-center text-5xl font-satoshi-bold uppercase mt-24 mb-12">Daily Timesheet</h1>

      {/* Import Logs and Export Timesheet Buttons */}
      <div className="flex justify-center gap-5 mb-8">
        <Button
          variant="default"
          className="p-3 w-xl bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
          onClick={() => setShowUploadBox(!showUploadBox)}
        >
          Import Logs
        </Button>
        <Button
          variant="default"
          className="p-3 w-xl bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
          onClick={exportToExcel}
        >
          Export Timesheet
        </Button>
      </div>

      {/* Conditional rendering of the drag-and-drop box */}
      {showUploadBox && (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-8 rounded-md text-center cursor-pointer ${
            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } mb-4`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".xlsx, .xls"
          />
          {isImporting ? (
            <p>Loading... Importing file</p>
          ) : (
            <p>Drag and drop an Excel file here, or click to select</p>
          )}
        </div>
      )}

      {/* Display import success/error message */}
      {importMessage && <p className="text-center text-green-500 mb-4">{importMessage}</p>}

      {/* Display error message if file is not an Excel file */}
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      {/* Timesheet Table */}
      <div className="container mx-auto p-8 rounded-xl border border-black">
        <Table className="w-full table-auto border-collapse">
          <TableHeader>
            <TableRow>
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
                <TableRow key={index} className="border-t border-black hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-300">
                  <TableCell className="border-none">{index + 1}</TableCell>
                  <TableCell className="border-none">{summary.fullName}</TableCell>
                  <TableCell className="border-none">{convertDateToLocal(summary.date)}</TableCell>
                  <TableCell className="border-none">{summary.totalTime}</TableCell>
                  <TableCell className="border-none">{convertTimeSpanToLocal(summary.timeSpan)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="border-t border-black">
                <TableCell colSpan={5} className="text-center pt-10 pb-5">
                  You have no records for today.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status messages based on last action */}
      {lastAction === 'TIME_OUT' ? (
        <p className="text-xl text-center mt-8">
          You have logged a total of <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> hours today.
        </p>
      ) : lastAction === 'BREAK' ? (
        <p className="text-xl text-center mt-8">
          You have worked for <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> so far.
        </p>
      ) : lastAction === 'TIME_IN' ? (
        <p className="text-xl text-center mt-8">
          Your timer is active. Click <b>Break</b> to pause or <b>Time Out</b> to stop.
        </p>
      ) : (
        <p className="text-xl text-center mt-8">
          Click <b>Time In</b> to start tracking your work hours.
        </p>
      )}

      {/* Buttons for Time In, Break, and Time Out */}
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-row justify-center items-center gap-5 p-5 rounded-lg mt-10 w-full max-w-6xl"
      >
        <Button
          variant="default"
          type="button"
          className="p-3 w-full bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
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
          className="p-3 w-full bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
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
          className="p-3 w-full bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
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
    second: '2-digit', // Include seconds
  });

  if (!endTimeUTC) {
    return localStartTime;
  }

  const localEndTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit', // Include seconds
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
