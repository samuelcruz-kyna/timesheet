import React, { useState } from 'react';
import { useFormik } from 'formik';
import { loginFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import NavBar from '@/components/ui/navBar';
import Link from 'next/link';

export default function Login() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema: loginFormSchema,
    onSubmit: async (values) => {
      try {
        const res = await fetch('/api/auth/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'read',
            username: values.username,
            password: values.password
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const signInResponse = await signIn('credentials', {
            redirect: false,
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            router.push('/');
          } else {
            setFormStatus('Login failed. Please try again.');
          }
        } else {
          setFormStatus(data.message || 'Login failed. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />
      <form onSubmit={formik.handleSubmit} className="p-8 rounded-lg max-w-lg w-full shadow-md border border-gray-700 space-y-6">
        <h1 className="text-center text-5xl font-extrabold uppercase">Login</h1>
        <p className="text-center">
          Don&apos;t have an account? <Link href="/account/register" className="underline text-white">Register</Link>
        </p>

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
            className="p-3 w-full border rounded-md bg-[#444] text-white focus:ring focus:ring-gray-500"
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
            className="p-3 w-full border rounded-md bg-[#444] text-white focus:ring focus:ring-gray-500"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm">{formik.errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button className="w-full bg-[#444] hover:bg-[#555] rounded-md transition-all duration-300" type="submit" disabled={formik.isSubmitting}>
          Login
        </Button>
        
        {formStatus && <p className="text-center text-red-500 mt-4">{formStatus}</p>}
      </form>
    </div>
  );
}
