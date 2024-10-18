import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { contactFormSchema } from '@/utils/validation-schema';
import * as Yup from 'yup';

const prisma = new PrismaClient();

// Validation
async function validateData(data, res) {
  try {
    await contactFormSchema.validate(data, { abortEarly: false });
    return true;
  }
  catch (error) {
    if (error instanceof Yup.ValidationError) {
      const validationErrors = {};
      error.inner.forEach((item) => {
        validationErrors[item.path] = item.message;
      });
      res.status(400).json({ errors: validationErrors });
      return false;
    }
    res.status(500).json({ message: 'Internal Server Error' });
    return false;
  }
}

// Database operations
async function handleInquiry(action, data, res, transactionNo = null) {
  // Validate data only for create and update operations
  if (action !== 'delete') {
    const isValid = await validateData(data, res);
    if (!isValid) return;
  }
  try {
    let result;
    // Create operation
    if (action === 'create') {
      result = await prisma.inquiries.create({
        data: {
          ...data,
          status: 'Pending',
          transactionNo: uuid(),
        },
      });
      return res.status(201).json({ message: 'Inquiry created successfully', inquiry: result });
    } 
    // Update operation
    else if (action === 'update') {
      result = await prisma.inquiries.update({
        where: { transactionNo },
        data: {
          ...data,
          modified: new Date(),
        },
      });
      return res.status(200).json({ message: 'Inquiry updated successfully', inquiry: result });
    } 
    // Delete operation
    else if (action === 'delete') {
      result = await prisma.inquiries.delete({
        where: { transactionNo },
      });
      return res.status(200).json({ message: 'Inquiry deleted successfully', inquiry: result });
    }
  } 
  catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

export default async function handleInquiryRequest(req, res) {
  const { action, transactionNo, firstName, lastName, contactNo, emailAddress, subject, message, status } = req.body;

  if (req.method === 'POST') {
    const data = { firstName, lastName, contactNo, emailAddress, subject, message, status };
    if (action === 'create') {
      // Create new inquiry
      await handleInquiry('create', data, res);
    } 
    else if (action === 'update') {
      // Update existing inquiry based on transactionNo
      if (!transactionNo) {
        return res.status(400).json({ message: 'Transaction number is required for update.' });
      }
      await handleInquiry('update', data, res, transactionNo);
    } 
    else if (action === 'delete') {
      // Delete inquiry based on transactionNo
      if (!transactionNo) {
        return res.status(400).json({ message: 'Transaction number is required for delete.' });
      }
      await handleInquiry('delete', null, res, transactionNo);
    } 
    else {
      // Invalid action handling
      return res.status(400).json({ message: 'Invalid action provided.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}