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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          setFormStatus('Success! Your inquiry was submitted.');
          formik.resetForm(); // Reset form after successful submission
        } else {
          setFormStatus('Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />

      <div className="mt-20 w-full max-w-lg px-6">
        <h1 className="text-center text-5xl font-extrabold uppercase text-[var(--foreground)] mb-8">
          Contact Me
        </h1>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6 w-full">
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="First Name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.firstName}
            className="p-3 w-full border rounded-md text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.firstName && formik.errors.firstName && (
            <p className="text-red-500 text-sm">{formik.errors.firstName}</p>
          )}

          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Last Name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.lastName}
            className="p-3 w-full border rounded-md text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.lastName && formik.errors.lastName && (
            <p className="text-red-500 text-sm">{formik.errors.lastName}</p>
          )}

          <Input
            id="contactNo"
            name="contactNo"
            type="tel"
            placeholder="Contact Number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.contactNo}
            className="p-3 w-full border rounded-md text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.contactNo && formik.errors.contactNo && (
            <p className="text-red-500 text-sm">{formik.errors.contactNo}</p>
          )}

          <Input
            id="emailAddress"
            name="emailAddress"
            type="email"
            placeholder="Email Address"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.emailAddress}
            className="p-3 w-full border rounded-md text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.emailAddress && formik.errors.emailAddress && (
            <p className="text-red-500 text-sm">{formik.errors.emailAddress}</p>
          )}

          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="Subject"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.subject}
            className="p-3 w-full border rounded-md  text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.subject && formik.errors.subject && (
            <p className="text-red-500 text-sm">{formik.errors.subject}</p>
          )}

          <Textarea
            id="message"
            name="message"
            placeholder="Your Message"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.message}
            className="p-3 w-full border rounded-md text-white focus:ring focus:ring-gray-500 h-32"
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-red-500 text-sm">{formik.errors.message}</p>
          )}

          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="p-3 w-full bg-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300"
          >
            Submit
          </Button>

          {formStatus && <p className="text-center mt-4 text-green-500">{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}
