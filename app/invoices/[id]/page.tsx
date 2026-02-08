'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
  const [downloading, setDownloading] = useState(false);

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

  const downloadPDF = async () => {
    try {
      setDownloading(true);

      const node = document.getElementById('print-area');
      if (!node) return;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'pt', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;
      let heightLeft = pdfHeight;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div
        id="print-area"
        className="bg-white shadow-md rounded-lg p-8 text-gray-800 font-sans"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold rounded">
              JS
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold">Invoice</h1>
        </div>

        {/* Customer & Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <p className="font-semibold">Billed to:</p>
            <p>{invoice.customer_name}</p>
            <p>{invoice.customer_phone}</p>
            <p>{invoice.customer_address}</p>
          </div>
          <div className="text-left md:text-right">
            <p>
              <span className="font-semibold">Invoice No.</span> {invoice.invoice_number}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {invoice.invoice_date}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left pb-2">Item</th>
              <th className="text-left pb-2">Quantity</th>
              <th className="text-left pb-2">Unit Price</th>
              <th className="text-left pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{item.item_name}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{formatMoney(item.unit_price)}</td>
                <td className="py-2 font-semibold">
                  {formatMoney(Number(item.unit_price) * Number(item.quantity))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end gap-10 text-right mb-10">
          <div>
            <p className="font-semibold">Total</p>
            <p className="bg-gray-900 text-white px-4 py-2 rounded inline-block text-lg font-bold">
              {formatMoney(invoice.total_amount)}
            </p>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6">
            <p className="font-semibold mb-1">Notes:</p>
            <p className="italic text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-xl italic mb-4">Thank You!</p>
          <p className="text-sm">
            Payment Information:<br />
            Bank: Fauget Bank<br />
            Account Name: Juliana Silva<br />
            Account No: 123-456-7890<br />
            Pay by: {invoice.due_date || 'N/A'}
          </p>
        </div>

        {/* Download Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 bg-black hover:bg-black disabled:opacity-60 text-white px-4 py-2 rounded-md"
          >
            <Download size={20} />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
