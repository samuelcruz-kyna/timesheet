import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Initialize Prisma Client for database access
const prisma = new PrismaClient();

// Function to format a date into a readable string
function formatDateForDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
function formatDateForDisplayManual(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Function to group records bi-monthly (1-15 and 16-31 of each month)
function groupByBiMonthly(records) {
  const biMonthly = { "1-15": [], "16-31": [] }; // Two periods within the month

  // Categorize records into the first or second half of the month
  records.forEach((record) => {
    const date = new Date(record.date);
    const day = date.getUTCDate();
    const monthName = date.toLocaleString('en-US', { month: 'long' }); // Month name

    if (day <= 15) {
      biMonthly["1-15"].push({ ...record, period: `${monthName} 15th Pay` });
    } else {
      biMonthly["16-31"].push({ ...record, period: `${monthName} 30th Pay` });
    }
  });

  // Sum up payAmount and duration for each bi-monthly period
  return Object.entries(biMonthly).map(([_, recs]) => ({
    date: recs.length > 0 ? recs[0].period : "", // Use the period label from the first record
    payAmount: recs.reduce((sum, r) => sum + r.payAmount, 0),
    duration: recs.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
    status: "Unpaid",
  }));
}

// Function to group records monthly (e.g., "October 30th Pay")
function groupByMonthly(records) {
  const monthly = {};

  // Group records by month and year
  records.forEach((record) => {
    const date = new Date(record.date);
    const monthName = date.toLocaleString('en-US', { month: 'long' }); // Month name
    const year = date.getUTCFullYear();
    const key = `${year}-${monthName}`; // Unique key for each month

    if (!monthly[key]) {
      monthly[key] = {
        date: `${monthName} 30th Pay`, // Label as "Month 30th Pay"
        payAmount: 0,
        duration: 0,
        status: "Unpaid",
      };
    }

    monthly[key].payAmount += record.payAmount; // Sum up payAmount for the month
    monthly[key].duration += (record.dailySummary?.totalTime || 0) / 3600; // Sum up duration in hours
  });

  // Return an array of monthly summaries
  return Object.values(monthly);
}

// Function to filter and group records based on a custom date range
async function groupByManual(records, startDate, endDate) {
  // Convert startDate and endDate to local date strings (YYYY-MM-DD format based on locale)
  const localStartDateStr = new Date(startDate).toLocaleDateString();
  const localEndDateStr = new Date(endDate).toLocaleDateString();

  // Filter records within the specified date range using only the date portion
  const filteredRecords = records.filter(record => {
    const recordDateStr = new Date(record.date).toLocaleDateString();
    return recordDateStr >= localStartDateStr && recordDateStr <= localEndDateStr;
  });

  // Aggregate payAmount and duration within the date range
  return [{
    date: `${formatDateForDisplayManual(startDate)} - ${formatDateForDisplayManual(endDate)}`,
    payAmount: filteredRecords.reduce((sum, r) => sum + r.payAmount, 0),
    duration: filteredRecords.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
    status: "Unpaid",
  }];
}



// Main handler function to process the API request
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log("Request Body:", req.body);

  try {
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({ where: { employeeNo } });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { payoutMethod, payoutFrequency, dateRange } = req.body;
    const employeeId = employee.id;
    let groupedRecords = [];
    let paymentRecords;

    if (payoutMethod === 'Manual' && dateRange?.startDate && dateRange?.endDate) {
      // Set startDate to the start of the day (UTC)
      const startDate = new Date(dateRange.startDate);
      startDate.setUTCHours(0, 0, 0, 0); // Midnight at UTC on start date

      // Set endDate to midnight of the day after the end date for inclusive filtering
      const endDate = new Date(dateRange.endDate);
      endDate.setUTCHours(0, 0, 0, 0); // Midnight UTC on end date
      endDate.setUTCDate(endDate.getUTCDate() + 2); // Move to the next day

      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
          date: {
            gte: startDate, // Greater than or equal to startDate
            lte: endDate,    // Less than the day after endDate
          },
        },
        include: {
          dailySummary: {
            select: {
              totalTime: true,
            },
          },
        },
      });
      // Adjust startDate and endDate for groupByManual
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setUTCDate(adjustedStartDate.getUTCDate() + 1); // Add 1 day to start date

      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setUTCDate(adjustedEndDate.getUTCDate() - 1); // Subtract 1 day from end date

      // Use the adjusted dates for grouping purposes
      groupedRecords = await groupByManual(paymentRecords, adjustedStartDate, adjustedEndDate);

    } else if (payoutMethod === 'Automatic') {
      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
        },
        include: {
          dailySummary: {
            select: {
              totalTime: true,
            },
          },
        },
      });

      if (payoutFrequency === 'Daily') {
        groupedRecords = paymentRecords.map(record => ({
          date: formatDateForDisplay(record.date),
          payAmount: record.payAmount,
          duration: (record.dailySummary?.totalTime || 0) / 3600,
          status: record.status,
        }));
      } else if (payoutFrequency === 'Bi-Monthly') {
        groupedRecords = groupByBiMonthly(paymentRecords);
      } else if (payoutFrequency === 'Monthly') {
        groupedRecords = groupByMonthly(paymentRecords);
      } else {
        return res.status(400).json({ message: 'Invalid payout frequency for Automatic' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid payout method or missing date range for Manual' });
    }

    return res.status(200).json({
      groupedRecords,
    });
  } catch (error) {
    console.error('Error fetching payout records:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}