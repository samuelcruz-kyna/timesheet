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
        const data = await response.json();

        // Format dates to "MMM D" format
        const formattedData = data.map((item) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));

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
    if (!chartData || chartData.length === 0) return [0, 'auto'];

    const maxPayAmount = Math.max(...chartData.map((item) => item.payAmount));
    
    switch (filter) {
      case "daily":
        return [0, maxPayAmount + 800]; // Add padding above max value for daily
      case "weekly":
        return [0, 600]; // Logic from old code for weekly filter
      case "monthly":
        return [0, maxPayAmount + 100]; // Add padding above max value for monthly
      default:
        return [0, 'auto'];
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
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                barCategoryGap="0%" // Removes space between bars
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: "10px" }} /> {/* Display abbreviated date */}
                <YAxis domain={getYAxisDomain()} />
                <Tooltip cursor={{ fill: "none" }} />
                <Bar
                  dataKey="payAmount"
                  fill="#1F2937"
                  radius={[4, 4, 0, 0]}
                  barSize={40} // Increase bar width to reduce gaps further
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
