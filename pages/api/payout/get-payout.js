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
  const biMonthly = { "1-15": [], "16-31": [] };

  records.forEach((record) => {
    const date = new Date(record.date);
    const day = date.getUTCDate();
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    if (day <= 15) {
      biMonthly["1-15"].push({ ...record, period: `${monthName} 15th Pay` });
    } else {
      biMonthly["16-31"].push({ ...record, period: `${monthName} 30th Pay` });
    }
  });

  return Object.entries(biMonthly).map(([_, recs]) => ({
    date: recs.length > 0 ? recs[0].period : "",
    payAmount: recs.reduce((sum, r) => sum + r.payAmount, 0),
    duration: recs.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
    status: "Unpaid",
  }));
}

// Function to group records monthly (e.g., "October 30th Pay")
function groupByMonthly(records) {
  const monthly = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getUTCFullYear();
    const key = `${year}-${monthName}`;

    if (!monthly[key]) {
      monthly[key] = {
        date: `${monthName} 30th Pay`,
        payAmount: 0,
        duration: 0,
        status: "Unpaid",
      };
    }

    monthly[key].payAmount += record.payAmount;
    monthly[key].duration += (record.dailySummary?.totalTime || 0) / 3600;
  });

  return Object.values(monthly);
}

// Function to filter and group records based on a custom date range
async function groupByManual(records, startDate, endDate) {
  const localStartDateStr = new Date(startDate).toLocaleDateString();
  const localEndDateStr = new Date(endDate).toLocaleDateString();

  const filteredRecords = records.filter(record => {
    const recordDateStr = new Date(record.date).toLocaleDateString();
    return recordDateStr >= localStartDateStr && recordDateStr <= localEndDateStr;
  });

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
      // Convert the startDate and endDate strings to Date objects for comparison
      const startDate = new Date(dateRange.startDate);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(dateRange.endDate);
      endDate.setUTCHours(23, 59, 59, 999); // Set end of day for inclusive filtering

      // Fetch unpaid payment records within the date range
      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
          date: {
            gte: startDate,
            lte: endDate,
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

      // Group records by the specified date range using groupByManual function
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

    return res.status(200).json({ groupedRecords });
  } catch (error) {
    console.error('Error fetching payout records:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
