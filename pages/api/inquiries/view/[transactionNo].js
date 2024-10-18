import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function fetchInquiryDetails(req, res) {
  const { transactionNo } = req.query;

  if (req.method === 'GET') {
    try {
      const inquiryDetails = await prisma.inquiries.findUnique({ where: { transactionNo } });
      if (!inquiryDetails) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      return res.status(200).json(inquiryDetails);
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  return res.status(405).json({ message: 'Method Not Allowed' });
}