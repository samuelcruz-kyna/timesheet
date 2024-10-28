import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch the latest 10 timesheet records
    const timesheets = await prisma.timesheet.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        time: true,
        type: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
      },
    });

    return res.status(200).json(timesheets);
  } catch (error) {
    console.error("Error fetching timesheet records:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}