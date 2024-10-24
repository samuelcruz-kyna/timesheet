import { useState, useEffect } from "react";
import { Formik, Form, ErrorMessage } from 'formik';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeePayrateFormSchema } from '@/utils/validation-schema';
import { useSession } from "next-auth/react";
import NavBar from '@/components/ui/navBar';

export default function Employee() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  const [filter, setFilter] = useState('daily');

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    try {
      console.log("Request JSON: ", JSON.stringify(values, null, 2));
      const response = await fetch('/api/payrate/calculate-payrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log('Payrate calculation successful');
        fetchPaymentRecords();
      } else {
        const errorData = await response.json();
        console.error('Error calculating payrate:', errorData);
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
    setIsSubmitting(false);
    setSubmitting(false);
  };

  const fetchPaymentRecords = async () => {
    try {
      const response = await fetch(`/api/payrate/get-payments?filter=${filter}`);
      const data = await response.json();
      if (response.ok) {
        setPaymentRecords(data);
      } else {
        console.error('Error fetching payment records:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPaymentRecords();
    }
  }, [session, filter]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0A0A0A] text-white font-helvetica">
      <NavBar />
      
      <div className="flex flex-col items-center mt-16">
        {/* Employee Header */}
        <h1 className="text-5xl font-extrabold text-white uppercase text-center">
          Employee
        </h1>

        {/* Landscape Layout: Pay Rate Form and Payment Records Side-by-Side */}
        <div className="flex flex-row justify-between gap-16 mt-10 w-full max-w-7xl">
          {/* Pay Rate Form */}
          <div className="bg-[#1D1D1D] p-8 w-full max-w-md rounded-lg shadow-lg border border-gray-600">
            <h2 className="text-xl font-bold text-center mb-4">Set Pay Rate</h2>

            <Formik
              initialValues={{
                payRate: '',
                payRateSchedule: '',
                effectiveDate: '',
              }}
              validationSchema={employeePayrateFormSchema}
              onSubmit={handleSubmit}
            >
              {({ setFieldValue, values }) => (
                <Form className="flex flex-col gap-6">
                  {/* Pay Rate */}
                  <div>
                    <label htmlFor="payRate" className="block mb-2">Pay Rate</label>
                    <Input
                      id="payRate"
                      name="payRate"
                      type="number"
                      placeholder="Enter a Pay Rate"
                      className="w-full p-4 border rounded-lg bg-[#2A2A2A] text-white"
                      value={values.payRate}
                      onChange={(e) => setFieldValue('payRate', Number(e.target.value))}
                    />
                    <ErrorMessage name="payRate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Pay Rate Schedule */}
                  <div>
                    <label htmlFor="payRateSchedule" className="block mb-2">Pay Rate Schedule</label>
                    <Select
                      value={values.payRateSchedule}
                      onValueChange={(value) => setFieldValue('payRateSchedule', value)}
                    >
                      <SelectTrigger className="w-full p-4 rounded-lg bg-[#2A2A2A] text-white font-bold">
                        <SelectValue placeholder="Select Rate Schedule" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] rounded-lg">
                        <SelectItem value="Hourly" className="hover:bg-gray-700 text-white font-bold">
                          Hourly
                        </SelectItem>
                        <SelectItem value="Daily" className="hover:bg-gray-700 text-white font-bold">
                          Daily
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="payRateSchedule" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label htmlFor="effectiveDate" className="block mb-2">Effective Date</label>
                    <DatePicker
                      date={values.effectiveDate}
                      onChange={(date) => setFieldValue('effectiveDate', date)}
                      className="w-full p-4 rounded-lg bg-[#2A2A2A] text-white"
                    />
                    <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>

          {/* Payment Records */}
          <div className="w-full max-w-2xl bg-[#1D1D1D] p-8 rounded-lg shadow-lg border border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Payment Records</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2">
                    Filter by:
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#2A2A2A] p-4 rounded-lg shadow-md">
                  <Button onClick={() => setFilter('daily')} className="block w-full bg-gray-700 hover:bg-gray-600 p-2 rounded-lg mb-2">Daily</Button>
                  <Button onClick={() => setFilter('weekly')} className="block w-full bg-gray-700 hover:bg-gray-600 p-2 rounded-lg mb-2">Weekly</Button>
                  <Button onClick={() => setFilter('monthly')} className="block w-full bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">Monthly</Button>
                </PopoverContent>
              </Popover>
            </div>

            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payroll Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRecords.length > 0 ? (
                  paymentRecords.map((record) => (
                    <TableRow key={record.date}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>${record.payAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="2" className="text-center">No payment records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
