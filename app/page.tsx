'use client';

import axios from 'axios';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

/* Backend Types */
interface BackendItem {
  item_name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

interface BackendInvoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: string;
  discount: string;
  total_amount: string;
  notes: string;
  created_at: string;
  items: BackendItem[];
}

interface InvoiceApiResponse {
  status: string;
  message: string;
  data: {
    data: BackendInvoice[];
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

/* Frontend Types */
interface Item {
  item_name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

interface Invoice {
  id: number;
  invoiceNo: string;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  items: Item[];
}

export default function InvoiceListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get<InvoiceApiResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/invoices`
      );

      const backendInvoices = response.data.data?.data || [];

      const formatted: Invoice[] = backendInvoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoice_number,
        customerName: inv.customer_name,
        phone: inv.customer_phone,
        address: inv.customer_address,
        status: inv.status,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        subtotal: Number(inv.subtotal),
        discount: Number(inv.discount),
        totalAmount: Number(inv.total_amount),
        notes: inv.notes,
        createdAt: inv.created_at,
        items: inv.items || [],
      }));

      setInvoices(formatted);
    } catch (err) {
      console.error('Fetch failed', err);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this invoice?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    const deletingToast = toast.loading('Deleting invoice...');
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success('Invoice deleted successfully!', { id: deletingToast });
      // Swal.fire('Deleted!', 'The invoice has been deleted.', 'success');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete invoice', { id: deletingToast });
      Swal.fire('Error!', 'Failed to delete invoice.', 'error');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const money = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full overflow-x-auto p-6">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invoice List</h1>
        <Link
          href="/add-invoice"
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + Add Invoice
        </Link>
      </div>

      {loading && <div className="text-center py-10 text-gray-500">Loading invoices...</div>}

      {!loading && invoices.length === 0 && (
        <div className="text-center py-10 text-gray-400">No invoices found.</div>
      )}

      {!loading && invoices.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-300">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {['ID','Invoice #','Customer','Phone','Address','Total','Created At','Actions'].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-2 border border-gray-300 text-left font-medium text-gray-700"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {invoices.map((inv) => (
                <Fragment key={inv.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(inv.id)}>
                    <td className="px-4 py-2 border border-gray-300">{inv.id}</td>
                    <td className="px-4 py-2 border border-gray-300">{inv.invoiceNo}</td>
                    <td className="px-4 py-2 border border-gray-300">{inv.customerName}</td>
                    <td className="px-4 py-2 border border-gray-300">{inv.phone}</td>
                    <td className="px-4 py-2 border border-gray-300">{inv.address}</td>
                    <td className="px-4 py-2 border border-gray-300">{money(inv.totalAmount)}</td>
                    <td className="px-4 py-2 border border-gray-300">{new Date(inv.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 border border-gray-300 flex gap-2">
                      <button
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="p-1 rounded hover:bg-blue-100 text-blue-600"
                        title="View Invoice"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => router.push(`/edit-invoice/${inv.id}`)}
                        className="p-1 rounded hover:bg-green-100 text-green-600"
                        title="Edit Invoice"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded items */}
                  {expandedIds.includes(inv.id) && inv.items.length > 0 && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 border border-gray-300 px-4 py-2">
                        <ul className="list-disc list-inside text-sm">
                          {inv.items.map((item, idx) => (
                            <li key={idx}>
                              <strong>{item.item_name}</strong> — {item.quantity} {item.unit || ''} @ {money(item.unit_price)} {item.description ? `(${item.description})` : ''}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
