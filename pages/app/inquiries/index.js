import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import NavBar from '@/components/ui/navBar';
import routes from '@/routes';

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inquiries");

      if (!response.ok) {
        throw new Error(`Error fetching inquiries: ${response.status}`);
      }

      const data = await response.json();
      setInquiries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleViewDetails = (transactionNo) => {
    router.push(routes.viewInquiries.replace("[transactionNo]", transactionNo));
  };

  const handleEditInquiry = (transactionNo) => {
    router.push(routes.editInquiries.replace("[transactionNo]", transactionNo));
  };

  if (loading) {
    return <div className="text-center mt-24">Loading inquiries...</div>;
  }

  if (error) {
    return <div className="text-center mt-24 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen font-satoshi-regular">
      <NavBar />
      <h1 className="text-center text-5xl font-satoshi-bold uppercase mt-24 mb-12">Inquiries</h1>

      {/* The container wrapping the table, with a fixed height and scroll overflow */}
      <div className="container mx-auto p-8 rounded-xl border border-gray-700">
        <div className="max-h-[400px] overflow-y-auto">
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Contact No</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction No</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.transactionNo}>
                  <TableCell>{inquiry.id}</TableCell>
                  <TableCell>{inquiry.firstName}</TableCell>
                  <TableCell>{inquiry.lastName}</TableCell>
                  <TableCell>{inquiry.contactNo}</TableCell>
                  <TableCell>{inquiry.emailAddress}</TableCell>
                  <TableCell>{inquiry.subject}</TableCell>
                  <TableCell>{inquiry.message.length > 100 ? `${inquiry.message.substr(0, 100)}...` : inquiry.message}</TableCell>
                  <TableCell>{inquiry.status}</TableCell>
                  <TableCell>{inquiry.transactionNo}</TableCell>
                  <TableCell>{new Date(inquiry.created).toLocaleString()}</TableCell>
                  <TableCell>{new Date(inquiry.modified).toLocaleString()}</TableCell>
                  <TableCell className="space-y-2">
                    <Button 
                      className="w-full p-2 bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black" 
                      onClick={() => handleViewDetails(inquiry.transactionNo)}
                    >
                      View Details
                    </Button>
                    <Button 
                      className="w-full p-2 bg-[#171717] text-white rounded-md hover:bg-gray-600 hover:text-white transition-colors duration-300 border border-black" 
                      onClick={() => handleEditInquiry(inquiry.transactionNo)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
