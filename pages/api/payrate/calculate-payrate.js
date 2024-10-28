import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { employeePayrateFormSchema } from '../../../utils/validation-schema';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // 1. Validate the data using the "employeePayrateFormSchema".
    const validatedData = await employeePayrateFormSchema.validate(req.body);
    const { payRate, payRateSchedule, effectiveDate } = validatedData;

    // 2. Get the current user and employeeId.
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({
      where: { employeeNo },
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeId = employee.id;

    // 3. Save the payRate, payRateSchedule, and effectiveDate of this user in PayRate table. Upsert it so there will be only 1 record.
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

    // 4. Fetch all daily summaries of this employee where date is the effectiveDate or later
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: effectiveDate
        }
      }
    });  

    // 5. Process the payroll calculations.
    const paymentRecords = [];

    for (const summary of dailySummaries) {
      // Calculate duration (in hours) from totalTime (in seconds)
      const duration = summary.totalTime / 3600;

      // Determine the pay amount
      let payAmount = 0;

      if (payRateSchedule === 'Hourly') {
        payAmount = duration * payRate;
      } 
      else if (payRateSchedule === 'Daily') {
        payAmount = payRate; // Fixed daily rate
      } 
      else {
        return res.status(400).json({ error: 'Invalid payRateSchedule' });
      }

      // Upsert the calculated payment.
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

      // Add the record with calculated duration to the response array
      paymentRecords.push({ ...paymentRecord, duration });
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
