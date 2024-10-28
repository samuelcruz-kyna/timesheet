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
        setChartData(data);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const getYAxisDomain = () => {
    switch (filter) {
      case "daily":
        return [0, 120];
      case "weekly":
        return [0, 600];
      case "monthly":
        return [0, 2000];
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
          <BarChart
            width={400}
            height={300}
            data={chartData}
            margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={getYAxisDomain()} />
            <Tooltip cursor={{ fill: "none" }} />
            <Bar
              dataKey="payAmount"
              fill="#1F2937"
              radius={[4, 4, 0, 0]} // Adjusted to subtle rounded corners at the top
              barSize={20}
            />
          </BarChart>
        )}
      </CardContent>
      <CardFooter>
        <div>Showing total payments for each {filter}.</div>
      </CardFooter>
    </Card>
  );
}
