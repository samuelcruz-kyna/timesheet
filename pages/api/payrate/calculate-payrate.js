import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { employeePayrateFormSchema } from '../../../utils/validation-schema';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

function formatDuration(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

export default async function handler(req, res) {
  try {
    const validatedData = await employeePayrateFormSchema.validate(req.body);
    const { payRate, payRateSchedule, effectiveDate } = validatedData;

    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({
      where: { employeeNo },
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeId = employee.id;

    await prisma.payRate.upsert({
      where: { employeeId },
      update: {
        payRate,
        payRateSchedule,
        effectiveDate: effectiveDate,
        updatedAt: new Date(),
      },
      create: {
        employeeId,
        payRate,
        payRateSchedule,
        effectiveDate: effectiveDate,
      },
    });

    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: effectiveDate
        }
      }
    });  

    const paymentRecords = [];

    for (const summary of dailySummaries) {
      const duration = formatDuration(summary.totalTime); // Format duration as HH:MM:SS
      let payAmount = 0;

      if (payRateSchedule === 'Hourly') {
        payAmount = (summary.totalTime / 3600) * payRate;
      } 
      else if (payRateSchedule === 'Daily') {
        payAmount = payRate;
      } 
      else {
        return res.status(400).json({ error: 'Invalid payRateSchedule' });
      }

      const paymentRecord = await prisma.paymentRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: employeeId,
            date: summary.date,
          },
        },
        update: {
          payAmount: payAmount,
          updatedAt: new Date(),
        },
        create: {
          employeeId: employeeId,
          date: summary.date,
          dailySummaryId: summary.id,
          payAmount: payAmount,
        },
      });

      paymentRecords.push({ ...paymentRecord, duration }); // Add formatted duration
    }

    return res.status(200).json({ paymentRecords });
  } 
  catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } 
  finally {
    await prisma.$disconnect();
  }
}
