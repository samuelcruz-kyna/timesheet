// payout.js
import { useState } from "react";
import { Formik, Form, ErrorMessage } from 'formik';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as Yup from 'yup';

// Define initial values and simplified validation schema for the payout form
const initialValues = {
  payoutMethod: 'Automatic',
  payoutFrequency: '',
  startDate: '',
  endDate: '',
};

const validationSchema = Yup.object({
  payoutMethod: Yup.string().required('Payout method is required'),
  payoutFrequency: Yup.string().nullable(), // No conditional validation here
  startDate: Yup.date().nullable(),
  endDate: Yup.date().nullable(),
});

export default function Payout() {
  const [payoutRecords, setPayoutRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to handle form submission and validate manually based on payoutMethod
  const fetchPayoutRecords = async (values) => {
    // Manual validation for payoutMethod
    if (values.payoutMethod === 'Automatic' && !values.payoutFrequency) {
      alert("Please select a payout frequency for Automatic payout.");
      return;
    }
    if (values.payoutMethod === 'Manual' && (!values.startDate || !values.endDate)) {
      alert("Please select both start and end dates for Manual payout.");
      return;
    }

    console.log("Payout form submitted with values:", values); // Debugging: Log submitted values
    setLoading(true);
    try {
      const response = await fetch('/api/payout/get-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Payout records received:", data.groupedRecords); // Debugging: Log received data
        setPayoutRecords(data.groupedRecords); // Set the fetched payout records
      } else {
        console.error('Failed to fetch payout records');
      }
    } catch (error) {
      console.error('Error fetching payout records:', error);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-between">
      {/* Payout Form Section */}
      <div className="w-[48%]">
        <h2 className="text-xl font-normal text-center mb-4">Set Payout Schedule</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={fetchPayoutRecords} // Submit form values to fetch payout records
        >
          {({ setFieldValue, values }) => (
            <Form className="flex flex-col gap-6">
              {/* Payout Method Selection */}
              <Select
                value={values.payoutMethod}
                onValueChange={(value) => {
                  console.log("Payout Method Selected:", value); // Debugging: Check selection
                  setFieldValue('payoutMethod', value);
                  setFieldValue('payoutFrequency', ''); // Reset payoutFrequency when switching methods
                  setFieldValue('startDate', ''); // Reset startDate when switching methods
                  setFieldValue('endDate', ''); // Reset endDate when switching methods
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose Payout Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage name="payoutMethod" component="div" className="text-red-500 text-sm" />

              {/* Conditional Fields Based on Payout Method */}
              {values.payoutMethod === 'Automatic' && (
                <Select
                  value={values.payoutFrequency}
                  onValueChange={(value) => {
                    console.log("Payout Frequency Selected:", value); // Debugging: Check selection
                    setFieldValue('payoutFrequency', value);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select Payout Frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Bi-Monthly">Bi-Monthly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <ErrorMessage name="payoutFrequency" component="div" className="text-red-500 text-sm" />

              {values.payoutMethod === 'Manual' && (
                <>
                  {/* Start Date Picker */}
                  <label className="text-sm font-semibold">Start Date</label>
                  <DatePicker
                    date={values.startDate}
                    onChange={(date) => {
                      console.log("Start Date Selected:", date); // Debugging: Check date selection
                      setFieldValue('startDate', date);
                    }}
                    placeholderText="Pick a Start Date"
                  />
                  <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm" />

                  {/* End Date Picker */}
                  <label className="text-sm font-semibold">End Date</label>
                  <DatePicker
                    date={values.endDate}
                    onChange={(date) => {
                      console.log("End Date Selected:", date); // Debugging: Check date selection
                      setFieldValue('endDate', date);
                    }}
                    placeholderText="Pick an End Date"
                  />
                  <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm" />
                </>
              )}

              {/* Submit Button */}
              <Button 
                type="submit"
                className="w-full p-2 bg-[#171717] text-white rounded-md hover:bg-gray-600 transition-colors duration-300 border border-black"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Submit'}
              </Button>
            </Form>
          )}
        </Formik>
      </div>

      {/* Payout Records Table */}
      <div className="w-[48%]">
        <h2 className="text-xl font-normal mb-4">Payout Records</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Duration (hours)</TableHead>
              <TableHead>Payroll Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutRecords.length > 0 ? (
              payoutRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.duration.toFixed(2)}</TableCell>
                  <TableCell>${record.payAmount.toFixed(2)}</TableCell>
                  <TableCell>{record.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4" className="text-center">No payout records found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
