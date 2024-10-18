// api/timesheet/insert.js
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const employeeNo = session?.user.employeeID;
  const { action } = req.body;

  if (!employeeNo) {
    return res.status(401).json({ message: 'Unauthorized, employee not found' });
  }

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

      // Get the latest entry for today
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

      let newEntry;

      if (action === 'TIME_IN') {
        if (latestEntry && latestEntry.type === 'TIME_OUT') {
          return res.status(400).json({ message: 'You cannot Time In after Time Out for today' });
        }

        newEntry = await prisma.timesheet.create({
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

      } else if (action === 'BREAK') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before taking a Break' });
        }

        newEntry = await prisma.timesheet.create({
          data: {
            type: 'BREAK',
            employeeID: employeeId,
            time: currentTime,
          },
        });

        await calculateTotalTime(employeeId, today, currentTime, 'BREAK');

      } else if (action === 'TIME_OUT') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before Time Out' });
        }

        newEntry = await prisma.timesheet.create({
          data: {
            type: 'TIME_OUT',
            employeeID: employeeId,
            time: currentTime,
          },
        });

        await calculateTotalTime(employeeId, today, currentTime, 'TIME_OUT');
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }

      return res.status(201).json({ message: `${action} logged`, timesheet: newEntry });
    } catch (error) {
      console.error('Error logging timesheet:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Helper function to calculate total time and update daily summary
async function calculateTotalTime(employeeId, today, currentTime, actionType) {
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
    console.error(`Error calculating total time for ${actionType}:`, error);
    throw new Error('Error calculating total time');
  }
}