import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import { contactFormSchema } from "@/utils/validation-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import NavBar from '@/components/ui/navBar';

export default function EditInquiry() {
  const router = useRouter();
  const { transactionNo } = router.query;

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formStatus, setFormStatus] = useState(null);

  const fetchInquiryDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inquiries/view/${transactionNo}`);
      if (!response.ok) {
        throw new Error(`Error fetching inquiry details: ${response.status}`);
      }
      const data = await response.json();
      setInquiry(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transactionNo]);

  useEffect(() => {
    if (transactionNo) {
      fetchInquiryDetails();
    }
  }, [transactionNo, fetchInquiryDetails]);

  const handleGoBack = () => {
    router.push("/app/inquiries");
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: inquiry?.firstName || "",
      lastName: inquiry?.lastName || "",
      contactNo: inquiry?.contactNo || "",
      emailAddress: inquiry?.emailAddress || "",
      subject: inquiry?.subject || "",
      message: inquiry?.message || "",
      status: inquiry?.status || "pending",
    },
    validationSchema: contactFormSchema,
    onSubmit: async (values) => {
      try {
        const res = await fetch(`/api/inquiries/manage`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        if (res.ok) {
          setFormStatus('Inquiry updated successfully.');
        } else {
          setFormStatus('Failed to update inquiry.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    },
  });

  if (loading) {
    return <div className="text-center mt-24">Loading inquiry details...</div>;
  }

  if (error) {
    return <div className="text-center mt-24 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-helvetica">
      <NavBar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-5xl font-extrabold uppercase mt-12 mb-8">Edit Inquiry</h1>
        <form onSubmit={formik.handleSubmit} className="p-8 rounded-lg max-w-3xl w-full shadow-md border border-gray-700 space-y-4">
          {['firstName', 'lastName', 'contactNo', 'emailAddress', 'subject', 'message'].map((field, index) => (
            <div key={index}>
              {field === 'message' ? (
                <Textarea
                  id={field}
                  name={field}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[field]}
                  placeholder="Your message"
                  className="p-3 w-full border rounded-md bg-[#444] text-white focus:ring focus:ring-gray-500"
                />
              ) : (
                <Input
                  id={field}
                  name={field}
                  type={field === 'emailAddress' ? 'email' : 'text'}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[field]}
                  placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  className="p-3 w-full border rounded-md bg-[#444] text-white focus:ring focus:ring-gray-500"
                />
              )}
              {formik.touched[field] && formik.errors[field] && (
                <p className="text-red-500 text-sm">{formik.errors[field]}</p>
              )}
            </div>
          ))}
          <div>
            <Select onValueChange={(value) => formik.setFieldValue("status", value)} value={formik.values.status}>
              <SelectTrigger className="rounded bg-[#444] text-white p-3 w-full border">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#222] rounded">
                <SelectItem value="Pending" className="hover:bg-gray-700 text-white font-bold">Pending</SelectItem>
                <SelectItem value="Read" className="hover:bg-gray-700 text-white font-bold">Read</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.status && formik.errors.status && (
              <p className="text-red-500 text-sm">{formik.errors.status}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="p-3 w-full bg-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300"
          >
            Update Inquiry
          </Button>

          <Button
            type="button"
            className="p-3 w-full bg-gray-700 text-white rounded-md hover:bg-gradient-to-r hover:from-[#4a4a4a] hover:to-[#b3b3b3] transition-all duration-300 mt-4"
            onClick={handleGoBack}
          >
            ← Back to Inquiries
          </Button>

          {formStatus && <p className="text-center mt-4 text-green-500">{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}
