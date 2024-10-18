import { PrismaClient } from '@prisma/client';
import { registerFormSchema, loginFormSchema } from '@/utils/validation-schema';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Function to generate a 6-character employee number
function generateEmployeeNo() {
  return uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
}

// Function to validate data against the given schema
async function validateData(schema, data, res) {
  try {
    await schema.validate(data, { abortEarly: false });
    return true;
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const validationErrors = {};
      error.inner.forEach((item) => {
        validationErrors[item.path] = item.message;
      });
      if (res) {
        res.status(400).json({ errors: validationErrors });
      }
      return false;
    }
    if (res) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
    return false;
  }
}

// Handle user registration and login
export default async function handler(req, res) {
  const { action, username, password, firstName, lastName, gender, status } = req.body;

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validate 'action' field
  const validationErrors = {};
  if (!action || (action !== 'create' && action !== 'read')) {
    validationErrors['action'] = 'Invalid action';
  }

  // Registration action
  if (action === 'create') {
    const userData = { username, password, status: status ?? 'ACTIVE' };
    const employeeData = { firstName, lastName, gender, employeeNo: generateEmployeeNo() };

    const isRegisterValid = await validateData(registerFormSchema, { ...userData, ...employeeData }, res);
    if (!isRegisterValid) return; // Response is sent in validateData

    try {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(409).json({ message: 'Username is already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const newEmployee = await prisma.employee.create({
        data: {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          gender: employeeData.gender,
          employeeNo: employeeData.employeeNo,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const newUser = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          status: userData.status,
          employeeID: newEmployee.employeeNo,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return res.status(201).json({
        message: 'User and Employee created successfully',
        user: newUser,
        employee: newEmployee,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Database error', error: error.message });
    }
  }

  // Login action
  else if (action === 'read') {
    const userData = { username, password };
    const isLoginValid = await validateData(loginFormSchema, userData, res);
    if (!isLoginValid) return; // Response is sent in validateData

    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          status: user.status,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Database error', error: error.message });
    }
  }

  // If there are validation errors for 'action', return them
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }
}
