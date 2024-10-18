import * as Yup from 'yup';

export const contactFormSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  contactNo: Yup.string()
    .length(11, 'Contact number should be exactly 11 digits')
    .required('Contact number is required')
    .matches(/^\d+$/, 'Contact number should contain only digits'),
  emailAddress: Yup.string().email('Invalid email address').required('Email is required'),
  subject: Yup.string().required('Subject is required'),
  message: Yup.string().required('Message is required'),
});

export const registerFormSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  gender: Yup.mixed().oneOf(['MALE', 'FEMALE', 'OTHER'], 'Gender must be MALE, FEMALE, or OTHER').required('Gender is required'),
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

export const loginFormSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});




