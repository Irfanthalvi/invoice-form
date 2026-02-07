'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

interface Item {
  item_name: string;
  quantity: number;
  unit_price: number | string;
  unit: string;
  description?: string;
}

interface Invoice {
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number | string;
  discount: number | string;
  total_amount: number | string;
  notes: string;
  items: Item[];
}

export default function ViewInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get<{ data: Invoice }>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${params.id}`
        );
        setInvoice(res.data.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch invoice');
      }
    };
    fetchInvoice();
  }, [params.id]);

  if (!invoice)
    return <div className="text-center py-20 text-gray-500 text-lg">Loading invoice...</div>;

  const formatMoney = (v: number | string) => Number(v || 0).toFixed(2);

  // PDF download function
  const downloadPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text(`Invoice #${invoice.invoice_number}`, 40, 50);

    doc.setFontSize(12);
    doc.text(`Customer: ${invoice.customer_name}`, 40, 70);
    doc.text(`Phone: ${invoice.customer_phone}`, 40, 85);
    doc.text(`Address: ${invoice.customer_address}`, 40, 100);
    doc.text(`Status: ${invoice.status}`, 40, 115);
    doc.text(`Invoice Date: ${invoice.invoice_date}`, 40, 130);
    doc.text(`Due Date: ${invoice.due_date || '-'}`, 40, 145);

    // Items table
    let y = 170;
    doc.setFontSize(14);
    doc.text('Items:', 40, y);
    y += 10;

    invoice.items.forEach((item, i) => {
      const total = Number(item.quantity) * Number(item.unit_price);
      doc.setFontSize(12);
      doc.text(
        `${i + 1}. ${item.item_name} - ${item.quantity} ${item.unit} @ ${formatMoney(
          item.unit_price
        )} = ${formatMoney(total)} ${item.description ? `(${item.description})` : ''}`,
        50,
        y
      );
      y += 20;
    });

    // Summary
    y += 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, 40, y);
    y += 15;
    doc.text(`Discount: ${formatMoney(invoice.discount)}`, 40, y);
    y += 15;
    doc.setFontSize(14);
    doc.text(`Total: ${formatMoney(invoice.total_amount)}`, 40, y);

    // Notes
    if (invoice.notes) {
      y += 25;
      doc.setFontSize(12);
      doc.text('Notes:', 40, y);
      y += 15;
      doc.text(invoice.notes, 50, y);
    }

    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">Invoice Details</h1>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          <Download size={20} /> Download PDF
        </button>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Invoice #:</p>
          <p className="text-xl">{invoice.invoice_number}</p>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Status:</p>
          <p className="text-xl">{invoice.status}</p>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Customer:</p>
          <p className="text-xl">{invoice.customer_name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Phone:</p>
          <p className="text-xl">{invoice.customer_phone}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-lg font-semibold">Address:</p>
          <p className="text-xl">{invoice.customer_address}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 border-collapse rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {['Item', 'Unit', 'Qty', 'Unit Price', 'Total'].map((heading) => (
                  <th key={heading} className="px-4 py-2 border border-gray-300 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300">{item.item_name}</td>
                  <td className="px-4 py-2 border border-gray-300">{item.unit}</td>
                  <td className="px-4 py-2 border border-gray-300">{item.quantity}</td>
                  <td className="px-4 py-2 border border-gray-300">{formatMoney(item.unit_price)}</td>
                  <td className="px-4 py-2 border border-gray-300 font-semibold">
                    {formatMoney(Number(item.unit_price) * Number(item.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col md:flex-row justify-end gap-6 text-right mb-6">
        <div>
          <p className="text-lg font-semibold">Subtotal:</p>
          <p className="text-xl font-bold">{formatMoney(invoice.subtotal)}</p>
        </div>
        <div>
          <p className="text-lg font-semibold">Discount:</p>
          <p className="text-xl font-bold">{formatMoney(invoice.discount)}</p>
        </div>
        <div>
          <p className="text-lg font-semibold">Total:</p>
          <p className="text-2xl font-extrabold text-blue-600">{formatMoney(invoice.total_amount)}</p>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Notes</h2>
          <p className="text-lg">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
