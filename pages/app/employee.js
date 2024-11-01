// employee.js
import { useState, useEffect } from "react";
import { Formik, Form, ErrorMessage } from 'formik';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeePayrateFormSchema } from '@/utils/validation-schema';
import { useSession } from "next-auth/react";
import NavBar from '@/components/ui/navBar';
import Payout from './payout'; // Corrected path for a file in the same folder


export default function Employee() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  const [filter, setFilter] = useState('daily');
  const [activeTab, setActiveTab] = useState('payrate'); // 'payrate' or 'payout'

  // Submit handler for the Payrate form
  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/payrate/calculate-payrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        fetchPaymentRecords();
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
    setIsSubmitting(false);
    setSubmitting(false);
  };

  // Fetch payment records based on filter type
  const fetchPaymentRecords = async () => {
    try {
      const response = await fetch(`/api/payrate/get-payments?filter=${filter}`);
      const data = await response.json();
      setPaymentRecords(data);
    } catch (error) {
      console.error('Error fetching payment records:', error);
    }
  };

  // Fetch records on component load and when filter changes
  useEffect(() => {
    if (session) fetchPaymentRecords();
  }, [session, filter]);

  return (
    <div className="flex flex-col items-center min-h-screen font-satoshi-regular">
      {/* Fixed NavBar */}
      <div className="w-full fixed top-0 left-0 z-50 bg-white shadow-md">
        <NavBar />
      </div>

      {/* Sticky Employee Title */}
      <div className="mt-20 w-full max-w-4xl text-center sticky top-[4rem] z-40 bg-white py-4">
        <h1 className="text-5xl font-satoshi-bold">Employee</h1>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col mt-12 w-full max-w-4xl items-center pt-[7rem]">
        <div className="p-8 w-full max-w-4xl rounded-md border border-black bg-white">
          {/* Tabs for Payrate and Payout */}
          <div className="flex justify-center space-x-8 mb-6 border-b border-gray-300 pb-4">
            <button
              className={`text-xl ${activeTab === 'payrate' ? 'text-black-500 underline' : 'text-gray-400'}`}
              onClick={() => setActiveTab('payrate')}
            >
              Payrate
            </button>
            <button
              className={`text-xl ${activeTab === 'payout' ? 'text-black-500 underline' : 'text-gray-400'}`}
              onClick={() => setActiveTab('payout')}
            >
              Payout
            </button>
          </div>

          {/* Tab Content - Payrate */}
          {activeTab === 'payrate' && (
            <div className="flex justify-between">
              {/* Payrate Form Section */}
              <div className="w-[48%]">
                <h2 className="text-xl font-normal text-center mb-4">Set Pay Rate</h2>
                <Formik
                  initialValues={{ payRate: '', payRateSchedule: '', effectiveDate: '' }}
                  validationSchema={employeePayrateFormSchema}
                  onSubmit={handleSubmit}
                >
                  {({ setFieldValue, values }) => (
                    <Form className="flex flex-col gap-6">
                      <Input
                        id="payRate"
                        name="payRate"
                        placeholder="Enter a Pay Rate"
                        value={values.payRate}
                        onChange={(e) => setFieldValue('payRate', Number(e.target.value))}
                      />
                      <ErrorMessage name="payRate" component="div" className="text-red-500 text-sm" />
                      <Select value={values.payRateSchedule} onValueChange={(value) => setFieldValue('payRateSchedule', value)}>
                        <SelectTrigger><SelectValue placeholder="Select Rate Schedule" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage name="payRateSchedule" component="div" className="text-red-500 text-sm" />
                      <DatePicker date={values.effectiveDate} onChange={(date) => setFieldValue('effectiveDate', date)} />
                      <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm" />
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full p-2 bg-[#171717] text-white rounded-md hover:bg-gray-600 transition-colors duration-300 border border-black"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </div>

              {/* Payment Records Section for Payrate */}
              <div className="w-[48%]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-normal">Payment Records</h2>
                  <Select value={filter} onValueChange={(value) => setFilter(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Daily" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Payroll Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.length > 0 ? (
                      paymentRecords.map((record) => (
                        <TableRow key={record.date} className="border-t border-black">
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.duration || "N/A"}</TableCell>
                          <TableCell>${record.payAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan="3" className="text-center">No payment records found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Tab Content - Payout */}
          {activeTab === 'payout' && <Payout />}
        </div>
      </div>
    </div>
  );
}
