import React, { useState } from 'react';
import { useFormik } from 'formik';
import { registerFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import NavBar from '@/components/ui/navBar';
import Link from 'next/link';

export default function Register() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      username: '',
      password: '',
    },
    validationSchema: registerFormSchema,
    onSubmit: async (values) => {
      try {
        const postData = {
          action: 'create',
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          username: values.username,
          password: values.password,
        };

        const res = await fetch('/api/auth/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          const signInResponse = await signIn('credentials', {
            redirect: false,
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            router.push('/');
          } else {
            setFormStatus('Registered, but could not log in automatically.');
          }
        } else {
          const errorData = await res.json();
          setFormStatus(errorData.message || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen font-satoshi-regular">
      <NavBar />
      <form onSubmit={formik.handleSubmit} className="p-8 rounded-lg max-w-lg w-full shadow-md border border-gray-700 space-y-6">
        <h1 className="text-center text-5xl font-satoshi-bold uppercase">Register</h1>
        <p className="text-center">
          Already have an account? <Link href="/account/login" className="underline text-black">Login</Link>
        </p>

        {/* First Name Input */}
        <div className="space-y-2">
          <Input
            id="firstName"
            name="firstName"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.firstName}
            placeholder="First Name"
            className="p-3 w-full border rounded-md text-black focus:ring focus:ring-gray-500"
          />
          {formik.touched.firstName && formik.errors.firstName && (
            <p className="text-red-500 text-sm">{formik.errors.firstName}</p>
          )}
        </div>

        {/* Last Name Input */}
        <div className="space-y-2">
          <Input
            id="lastName"
            name="lastName"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.lastName}
            placeholder="Last Name"
            className="p-3 w-full border rounded-md text-black focus:ring focus:ring-gray-500"
          />
          {formik.touched.lastName && formik.errors.lastName && (
            <p className="text-red-500 text-sm">{formik.errors.lastName}</p>
          )}
        </div>

        {/* Gender Select Input */}
        <div className="space-y-2">
          <Select onValueChange={(value) => formik.setFieldValue("gender", value)} value={formik.values.gender}>
            <SelectTrigger className="p-3 w-full border rounded-md text-black focus:ring focus:ring-gray-500">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem className="hover:bg-gray-700 text-black font-bold" value="MALE">Male</SelectItem>
              <SelectItem className="hover:bg-gray-700 text-black font-bold" value="FEMALE">Female</SelectItem>
              <SelectItem className="hover:bg-gray-700 text-black font-bold" value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-red-500 text-sm">{formik.errors.gender}</p>
          )}
        </div>

        {/* Username Input */}
        <div className="space-y-2">
          <Input
            id="username"
            name="username"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.username}
            placeholder="Username"
            className="p-3 w-full border rounded-md text-black focus:ring focus:ring-gray-500"
          />
          {formik.touched.username && formik.errors.username && (
            <p className="text-red-500 text-sm">{formik.errors.username}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Input
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            placeholder="Password"
            className="p-3 w-full border rounded-md text-black focus:ring focus:ring-gray-500"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm">{formik.errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          className="w-full p-3 bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black" 
          type="submit" 
          disabled={formik.isSubmitting}
        >
          Register
        </Button>

        {formStatus && <p className="text-center text-red-500 mt-4">{formStatus}</p>}
      </form>
    </div>
  );
}
