import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function ExcelUploader({ onImportSuccess }) {
  const [error, setError] = useState(null); // To store error messages
  const [files, setFiles] = useState([]); // To store uploaded file references

  const onDrop = useCallback((acceptedFiles) => {
    setError(null); // Reset error before processing

    const newFiles = acceptedFiles.map((file) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate structure before sending
          const isValid = validateExcelData(jsonData);
          if (!isValid) {
            setError("Invalid Excel format. Ensure it has 'Date', 'Type', and 'Time' columns with valid data.");
            return;
          }

          // Send JSON data to API endpoint
          const response = await fetch('/api/timesheet/insert-timesheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: jsonData })
          });

          const result = await response.json();
          if (!response.ok) {
            setError(result.message || 'Failed to import logs');
          } else {
            alert('Logs imported successfully!');
            const isTodayIncluded = checkIfTodayIncluded(jsonData);
            onImportSuccess(isTodayIncluded); // Notify parent component if today’s logs are present
          }
        } catch (error) {
          console.error("Error uploading logs:", error);
          setError("An unexpected error occurred while processing the file. Please check the file format and try again.");
        }
      };

      reader.readAsArrayBuffer(file);
      return file;
    });

    setFiles(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.xlsx, .xls',
    multiple: false,
  });

  // Helper function to check if today's date is in the uploaded logs
  const checkIfTodayIncluded = (logs) => {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' format
    return logs.some((log) => log.Date === today);
  };

  // Handler to remove a file
  const handleRemoveFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
    setError(null); // Clear any previous error when removing files
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg",
          isDragActive ? "bg-primary/10 border-primary" : "bg-muted/10 border-border",
          "hover:bg-muted transition-colors cursor-pointer"
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-muted-foreground">
          {isDragActive ? "Drop the Excel file here..." : "Drag and drop an Excel file here, or click to select"}
        </p>
      </div>

      {/* Display uploaded file list */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-gray-100 p-2 rounded border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-800">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(file)}
                className="ml-4 p-1 text-gray-500 hover:text-red-600 transition"
                aria-label={`Remove file ${file.name}`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Display error message */}
      {error && (
        <div className="mt-4 p-4 text-red-600 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

// Helper function to validate and normalize Excel data
function validateExcelData(data) {
  const requiredColumns = ["Date", "Type", "Time"];
  return data.every((row) => {
    const hasValidColumns = requiredColumns.every((col) => col in row);
    const isValidType = ["TIME_IN", "BREAK", "TIME_OUT"].includes(row.Type?.toUpperCase());
    if (hasValidColumns && isValidType) {
      row.Type = row.Type.toUpperCase();
      return true;
    }
    return false;
  });
}