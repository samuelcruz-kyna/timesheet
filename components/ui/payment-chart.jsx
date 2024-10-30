"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PaymentChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("daily");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/payrate/get-payments?filter=${filter}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        const records = Array.isArray(data) ? data : data.groupedRecords || [];

        const formattedData = records.map((item) => {
          let dateLabel;

          // Split date range if applicable
          const dateString = item.date;
          const dateParts = dateString.split(" to ");

          // Try to parse the first date in the range
          const date = new Date(dateParts[0]);
          console.log("Parsing date:", dateString, "Parsed date:", date);

          if (filter === "weekly") {
            if (!isNaN(date.getTime())) {
              const startOfWeek = new Date(date);
              const endOfWeek = new Date(date);
              startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
              endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

              dateLabel = `${startOfWeek.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })} to ${endOfWeek.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`;
            } else {
              const weekMatch = dateString.match(/^(\d{4})-W(\d{2})$/);
              if (weekMatch) {
                const year = parseInt(weekMatch[1], 10);
                const week = parseInt(weekMatch[2], 10);
                const firstDayOfYear = new Date(year, 0, 1);
                const daysOffset = (week - 1) * 7;
                const startOfWeek = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                dateLabel = `${startOfWeek.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} to ${endOfWeek.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`;
              } else {
                console.warn("Invalid date format:", dateString);
                dateLabel = "Invalid Date";
              }
            }
          } else {
            dateLabel = isNaN(date.getTime())
              ? "Invalid Date"
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
          }

          return {
            ...item,
            date: dateLabel,
          };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const getYAxisDomain = () => {
    if (!chartData || chartData.length === 0) return [0, "auto"];

    const maxPayAmount = Math.max(...chartData.map((item) => item.payAmount));

    switch (filter) {
      case "daily":
        return [0, maxPayAmount + 800];
      case "weekly":
        return [0, 100];
      case "monthly":
        return [0, maxPayAmount + 100];
      default:
        return [0, "auto"];
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Payments</CardTitle>
            <CardDescription>{`${filter.charAt(0).toUpperCase() + filter.slice(1)} Payments`}</CardDescription>
          </div>
          <div className="flex items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded p-1 px-3 bg-white text-black focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading chart data...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "600px" }}>
              <BarChart
                width={600}
                height={300}
                data={chartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }} // Adjust margins if necessary
                barCategoryGap="5%" // Adjust the gap between bars
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: "10px" }} />
                <YAxis domain={getYAxisDomain()} />
                <Tooltip cursor={{ fill: "none" }} />
                <Bar
                  dataKey="payAmount"
                  fill="#1F2937"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
              </BarChart>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div>Showing total payments for each {filter}.</div>
      </CardFooter>
    </Card>
  );
}
