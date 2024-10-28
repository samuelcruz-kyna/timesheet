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
          headers: { 'Content-Type': 'application/json' },
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
    <div className="flex flex-col min-h-screen font-satoshi-regular">
      <NavBar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-5xl font-satoshi-bold uppercase mt-12 mb-8">Edit Inquiry</h1>
        <form onSubmit={formik.handleSubmit} className="p-8 rounded-lg max-w-3xl w-full shadow-md border border-gray-700 space-y-4">
          <Input id="firstName" name="firstName" placeholder="First Name" {...formik.getFieldProps('firstName')} />
          <Input id="lastName" name="lastName" placeholder="Last Name" {...formik.getFieldProps('lastName')} />
          <Input id="contactNo" name="contactNo" placeholder="Contact No" {...formik.getFieldProps('contactNo')} />
          <Input id="emailAddress" name="emailAddress" type="email" placeholder="Email Address" {...formik.getFieldProps('emailAddress')} />
          <Input id="subject" name="subject" placeholder="Subject" {...formik.getFieldProps('subject')} />
          <Textarea id="message" name="message" placeholder="Message" {...formik.getFieldProps('message')} />
          <Select onValueChange={(value) => formik.setFieldValue("status", value)} value={formik.values.status}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            type="submit" 
            className="w-full p-3 bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black"
          >
            Update Inquiry
          </Button>
          <Button 
            type="button" 
            className="mt-4 w-full p-3 bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black" 
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
