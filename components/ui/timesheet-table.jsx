"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TimesheetTable() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch timesheet data from the API
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/timesheet/get-timesheet");
        const data = await response.json();
        setTimesheets(data);
      } catch (error) {
        console.error("Error fetching timesheet data:", error);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchTimesheets();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timesheet Logs</CardTitle>
        <CardDescription>Showing the latest 10 records of all employees.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <thead>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Employee</TableHead>
            </TableRow>
          </thead>
          <TableBody>
            {loading
              ? // Display skeleton rows while loading
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ))
              : // Display actual timesheet data once loaded
                timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      {new Date(timesheet.createdAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(timesheet.time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{timesheet.type}</TableCell>
                    <TableCell>{`${timesheet.employee.firstName} ${timesheet.employee.lastName}`}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}