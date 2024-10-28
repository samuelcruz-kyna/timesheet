import { useFormik } from 'formik';
import { contactFormSchema } from '../utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import NavBar from '@/components/ui/navBar';

export default function Contact() {
  const [formStatus, setFormStatus] = useState(null);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      contactNo: '',
      emailAddress: '',
      subject: '',
      message: ''
    },
    validationSchema: contactFormSchema,
    onSubmit: async (values) => {
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          setFormStatus('Success! Your inquiry was submitted.');
          formik.resetForm();
        } else {
          setFormStatus('Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen font-satoshi-regular">
      <NavBar />
      <div className="mt-5 w-full max-w-lg px-6">
        <h1 className="text-center text-5xl font-satoshi-bold uppercase mb-8">Contact Me</h1>
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 w-full">
          <Input id="firstName" name="firstName" placeholder="First Name" {...formik.getFieldProps('firstName')} />
          <Input id="lastName" name="lastName" placeholder="Last Name" {...formik.getFieldProps('lastName')} />
          <Input id="contactNo" name="contactNo" placeholder="Contact Number" {...formik.getFieldProps('contactNo')} />
          <Input id="emailAddress" name="emailAddress" type="email" placeholder="Email Address" {...formik.getFieldProps('emailAddress')} />
          <Input id="subject" name="subject" placeholder="Subject" {...formik.getFieldProps('subject')} />
          <Textarea id="message" name="message" placeholder="Your Message" {...formik.getFieldProps('message')} />
          <Button 
            type="submit" 
            className="p-3 w-full bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
          >
            Submit
          </Button>
          {formStatus && <p className="text-center mt-4 text-green-500">{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}
