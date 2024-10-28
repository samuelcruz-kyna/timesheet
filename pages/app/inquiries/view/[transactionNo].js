import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import NavBar from '@/components/ui/navBar';

export default function InquiryDetails() {
  const router = useRouter();
  const { transactionNo } = router.query;

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <h1 className="text-center text-5xl font-satoshi-bold uppercase mt-12 mb-8">Inquiry Details</h1>
        <div className="p-8 rounded-lg max-w-4xl w-full shadow-md border border-gray-700">
          {inquiry && (
            <div className="space-y-4">
              <p><strong>Transaction No:</strong> {inquiry.transactionNo}</p>
              <p><strong>First Name:</strong> {inquiry.firstName}</p>
              <p><strong>Last Name:</strong> {inquiry.lastName}</p>
              <p><strong>Contact No:</strong> {inquiry.contactNo}</p>
              <p><strong>Email Address:</strong> {inquiry.emailAddress}</p>
              <p><strong>Subject:</strong> {inquiry.subject}</p>
              <p><strong>Message:</strong> {inquiry.message}</p>
              <p><strong>Status:</strong> {inquiry.status}</p>
              <p><strong>Created:</strong> {new Date(inquiry.created).toLocaleString()}</p>
              <p><strong>Modified:</strong> {new Date(inquiry.modified).toLocaleString()}</p>
            </div>
          )}
          <Button className="mt-8" onClick={handleGoBack}>← Back to Inquiries</Button>
        </div>
      </div>
    </div>
  );
}
