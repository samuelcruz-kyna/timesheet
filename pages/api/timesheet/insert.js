// api/timesheet/insert.js
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const employeeNo = session?.user.employeeID;

  if (!employeeNo) {
    return res.status(401).json({ message: 'Unauthorized, employee not found' });
  }

  const { action, logs } = req.body; // `logs` will be present if this is an import request

  if (req.method === 'POST') {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeNo },
      });

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employeeId = employee.id;
      const currentTime = new Date(); // UTC by default
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC

      // If `logs` are present, handle as import data
      if (logs) {
        const validationResult = await validateAndProcessLogs(employeeId, logs);
        if (validationResult.error) {
          return res.status(400).json({ message: validationResult.message });
        }
        return res.status(201).json({ message: 'Logs imported successfully' });
      }

      // Handling individual actions (TIME_IN, BREAK, TIME_OUT) - Original functionality
      if (action === 'TIME_IN') {
        await handleTimeIn(employeeId, today, currentTime, res);
      } else if (action === 'BREAK') {
        await handleBreak(employeeId, today, currentTime, res);
      } else if (action === 'TIME_OUT') {
        await handleTimeOut(employeeId, today, currentTime, res);
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }

    } catch (error) {
      console.error('Error logging timesheet:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Helper function to handle TIME_IN action
async function handleTimeIn(employeeId, today, currentTime, res) {
  const latestEntry = await prisma.timesheet.findFirst({
    where: {
      employeeID: employeeId,
      time: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { time: 'desc' },
  });

  if (latestEntry && latestEntry.type === 'TIME_OUT') {
    return res.status(400).json({ message: 'You cannot Time In after Time Out for today' });
  }

  await prisma.timesheet.create({
    data: {
      type: 'TIME_IN',
      employeeID: employeeId,
      time: currentTime,
    },
  });

  await prisma.dailySummary.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    update: {},
    create: {
      employeeId,
      date: today,
      totalTime: 0,
    },
  });

  return res.status(201).json({ message: 'TIME_IN logged' });
}

// Helper function to handle BREAK action
async function handleBreak(employeeId, today, currentTime, res) {
  const latestEntry = await prisma.timesheet.findFirst({
    where: {
      employeeID: employeeId,
      time: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { time: 'desc' },
  });

  if (!latestEntry || latestEntry.type !== 'TIME_IN') {
    return res.status(400).json({ message: 'You must Time In before taking a Break' });
  }

  await prisma.timesheet.create({
    data: {
      type: 'BREAK',
      employeeID: employeeId,
      time: currentTime,
    },
  });

  await calculateTotalTime(employeeId, today);
  return res.status(201).json({ message: 'BREAK logged' });
}

// Helper function to handle TIME_OUT action
async function handleTimeOut(employeeId, today, currentTime, res) {
  const latestEntry = await prisma.timesheet.findFirst({
    where: {
      employeeID: employeeId,
      time: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { time: 'desc' },
  });

  if (!latestEntry || latestEntry.type !== 'TIME_IN') {
    return res.status(400).json({ message: 'You must Time In before Time Out' });
  }

  await prisma.timesheet.create({
    data: {
      type: 'TIME_OUT',
      employeeID: employeeId,
      time: currentTime,
    },
  });

  await calculateTotalTime(employeeId, today);
  return res.status(201).json({ message: 'TIME_OUT logged' });
}

// Helper function to validate and process logs for import
async function validateAndProcessLogs(employeeId, logs) {
  const validActions = ["TIME_IN", "BREAK", "TIME_OUT"];
  const dailyLogs = {};

  for (const log of logs) {
    const { Date: dateStr, Type: type, Time: timeStr } = log;
    const formattedType = type.toUpperCase();

    if (!validActions.includes(formattedType)) {
      return { error: true, message: `Invalid type '${type}' in logs` };
    }

    const logDate = new Date(dateStr);
    const logTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(logDate) || isNaN(logTime)) {
      return { error: true, message: "Invalid date or time format" };
    }

    const existingSummary = await prisma.dailySummary.findUnique({
      where: { employeeId_date: { employeeId, date: logDate } }
    });
    if (existingSummary) {
      return { error: true, message: `Logs already exist for ${dateStr}` };
    }

    if (!dailyLogs[dateStr]) dailyLogs[dateStr] = [];
    dailyLogs[dateStr].push({ employeeID: employeeId, time: logTime, type: formattedType });
  }

  for (const [date, entries] of Object.entries(dailyLogs)) {
    let lastAction = null;
    for (const entry of entries) {
      if (lastAction === "TIME_OUT" && entry.type !== "TIME_IN") {
        return { error: true, message: `Incorrect ordering on ${date}` };
      }
      lastAction = entry.type;
    }
  }

  for (const [dateStr, entries] of Object.entries(dailyLogs)) {
    const logDate = new Date(dateStr);

    await prisma.timesheet.createMany({
      data: entries,
    });

    const totalTime = calculateTotalTimeForEntries(entries);
    await prisma.dailySummary.create({
      data: { employeeId, date: logDate, totalTime: totalTime },
    });
  }

  return { error: false };
}

// Helper function to calculate total time for a list of imported entries
function calculateTotalTimeForEntries(entries) {
  let totalTime = 0;
  let lastTimeIn = null;

  entries.forEach((entry) => {
    if (entry.type === 'TIME_IN') {
      lastTimeIn = entry.time;
    } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
      totalTime += (entry.time - lastTimeIn) / 1000; // seconds
      lastTimeIn = null;
    }
  });

  return totalTime;
}

// Original calculateTotalTime function for daily summaries
async function calculateTotalTime(employeeId, today) {
  try {
    const timesheetEntries = await prisma.timesheet.findMany({
      where: {
        employeeID: employeeId,
        time: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { time: 'asc' },
    });

    let totalTime = 0;
    let lastTimeIn = null;

    timesheetEntries.forEach((entry) => {
      if (entry.type === 'TIME_IN') {
        lastTimeIn = new Date(entry.time);
      } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
        totalTime += (new Date(entry.time) - lastTimeIn) / 1000;
        lastTimeIn = null;
      }
    });

    await prisma.dailySummary.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: {
        totalTime: totalTime,
      },
      create: {
        employeeId,
        date: today,
        totalTime: totalTime,
      },
    });

    return totalTime;
  } catch (error) {
    console.error(`Error calculating total time:`, error);
    throw new Error('Error calculating total time');
  }
}
