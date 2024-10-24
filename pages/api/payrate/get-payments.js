import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

// Helper function to format date in a user-friendly format
function formatDateForDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Helper function to format a date range
function formatWeekRange(startDate, endDate) {
  const startOptions = { month: 'short', day: 'numeric' };
  const endOptions = { month: 'short', day: 'numeric' };

  const start = new Date(startDate).toLocaleDateString('en-US', startOptions);
  const end = new Date(endDate).toLocaleDateString('en-US', endOptions);

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${start} to ${end}`;
  } else {
    return `${start} to ${end}`;
  }
}

// Helper function to get the Monday of the week for a given date
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Function to group payment records by week
function groupByWeek(records) {
  if (records.length === 0) return [];

  const weeks = [];
  let currentWeek = [];
  let currentMonday = getMonday(new Date(records[0].date)); // Start with the first Monday
  let currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6); // Set to the next Sunday

  records.forEach((record) => {
    const recordDate = new Date(record.date);

    // Check if the record's date is within the current week
    if (recordDate >= currentMonday && recordDate <= currentSunday) {
      currentWeek.push(record);
    } else {
      // Push the current week data if not empty
      if (currentWeek.length > 0) {
        weeks.push({
          date: formatWeekRange(currentMonday, currentSunday),
          payAmount: currentWeek.reduce((sum, r) => sum + r.payAmount, 0),
        });
      }

      // Reset the week to the new Monday
      currentMonday = getMonday(recordDate);
      currentSunday = new Date(currentMonday);
      currentSunday.setDate(currentMonday.getDate() + 6);

      // Start a new week
      currentWeek = [record];
    }
  });

  // Push the last week if it has any records
  if (currentWeek.length > 0) {
    weeks.push({
      date: formatWeekRange(currentMonday, currentSunday),
      payAmount: currentWeek.reduce((sum, r) => sum + r.payAmount, 0),
    });
  }

  return weeks;
}

// Helper function to group records by month
function groupByMonth(records) {
  const months = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    const key = `${year}-${month + 1}`;
    const monthName = date.toLocaleString('default', { month: 'long' });
    const sortKey = year * 100 + (month + 1);

    if (!months[key]) {
      months[key] = {
        date: `${monthName} ${year}`,
        payAmount: 0,
        sortKey,
      };
    }
    months[key].payAmount += record.payAmount;
  });

  // Convert months object to array and sort
  const result = Object.values(months);
  result.sort((a, b) => b.sortKey - a.sortKey);

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({
      where: { employeeNo },
    });
    
    const { filter } = req.query;
    const employeeId = employee.id;
    
    // Fetch payment records for the employee
    const paymentRecords = await prisma.paymentRecord.findMany({
      where: {
        employeeId,
      },
      orderBy: { date: 'desc' },
    });

    let groupedRecords = [];

    if (filter === 'daily') {
      // Daily records (no grouping needed)
      groupedRecords = paymentRecords.map((record) => ({
        date: formatDateForDisplay(record.date),
        payAmount: record.payAmount,
      }));
    } else if (filter === 'weekly') {
      // Group records by week
      groupedRecords = groupByWeek(paymentRecords);
    } else if (filter === 'monthly') {
      // Group records by month
      groupedRecords = groupByMonth(paymentRecords);
    } else {
      // Default to daily if filter is invalid
      groupedRecords = paymentRecords.map((record) => ({
        date: formatDateForDisplay(record.date),
        payAmount: record.payAmount,
      }));
    }

    // Respond with the grouped payment records
    return res.status(200).json(groupedRecords);
  } catch (error) {
    console.error('Error fetching payment records:', error);
    return res.status(400).json({ message: error.message });
  }
}