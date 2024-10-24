import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { employeePayrateFormSchema } from '@/utils/validation-schema';
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
    const employeeId = employee.id;

    // 3. Fetch all daily summaries of this employee where date is the effectiveDate
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: effectiveDate
        }
      }
    });  

    // 4. Process the payroll calculations.
    const paymentRecords = [];

    for (const summary of dailySummaries) {
      // a. Get the totalTime in hours.
      const totalHours = Math.floor(summary.totalTime / 3600); 

      // b. Determine the rate.
      let payAmount = 0;

      if (payRateSchedule === 'Hourly') {
        payAmount = totalHours * payRate;
      } 
      else if (payRateSchedule === 'Daily') {
        payAmount = payRate; // Fixed daily rate
      } 
      else {
        return res.status(400).json({ error: 'Invalid payRateSchedule' });
      }
      console.log("Upsert Data:", {
        employeeId: employeeId,
        date: summary.date,
        payAmount: payAmount,
      });
      
      // c. Upsert the calculated payment.
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
          payAmount: payAmount,
        },
      });

      paymentRecords.push(paymentRecord);
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