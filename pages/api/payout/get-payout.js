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

  // Aggregate payAmount and duration within the date range without filtering
  return [{
    date: `${formatDateForDisplayManual(localStartDateStr)} - ${formatDateForDisplayManual(localEndDateStr)}`,
    payAmount: records.reduce((sum, r) => sum + r.payAmount, 0),
    duration: records.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
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

      const startDate = new Date(dateRange.startDate);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setUTCHours(23, 59, 59, 999); 
      console.log("Received Start Date:", startDate);
      console.log("Received End Date:", endDate);
      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
          date: {
            gte: startDate, 
            lte: endDate
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
      console.log("Payment Records with Provided Dates:", paymentRecords);
      groupedRecords = await groupByManual(paymentRecords, startDate, endDate);

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