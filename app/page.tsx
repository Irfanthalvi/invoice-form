'use client';

import axios from 'axios';
import Link from 'next/link';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Eye, Edit, Trash2, Search, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TablePagination from '@mui/material/TablePagination';

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

function InvoiceListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // URL State
  // URL State
  const page = parseInt(searchParams.get('page') || '0', 10);
  const rowsPerPage = parseInt(searchParams.get('limit') || '6', 10);
  const debouncedSearch = searchParams.get('search') || '';

  // Local state for fast typing
  const [searchTerm, setSearchTerm] = useState(debouncedSearch);

  // Update URL on search change with debounce
  useEffect(() => {
    if (searchTerm === debouncedSearch && searchParams.has('search') === Boolean(searchTerm)) {
      return; 
    }

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      
      // Reset to page 0 on new search input only if search has actually changed
      if (debouncedSearch !== searchTerm) {
        params.set('page', '0');
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch, searchParams, pathname, router]);

  // Sync back if URL changes externally (e.g. back button)
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get<InvoiceApiResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/invoices`,
        { params: { page: page + 1, limit: rowsPerPage, search: debouncedSearch } }
      );

      const backendInvoices = response.data.data?.data || [];
      const total = response.data.data?.totalItems || 0;
      setTotalItems(total);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedSearch]);

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
      toast.success('Invoice deleted successfully!', { id: deletingToast });
      
      // If we deleted the only item on the page, go to previous page.
      // Otherwise, re-fetch data so backend pagination limit is always filled.
      if (invoices.length === 1 && page > 0) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page - 1));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        fetchInvoices();
      }
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

  const handleChangePage = (event: unknown, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', event.target.value);
    params.set('page', '0');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Invoice List</h1>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-black text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search invoices by name, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all sm:text-sm text-base bg-gray-50 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Link
            href="/add-invoice"
            className="w-full sm:w-auto justify-center whitespace-nowrap bg-black text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition shadow-md hover:shadow-lg font-medium tracking-wide flex items-center gap-1"
          >
            <span className="text-lg leading-none mb-[2px]">+</span> Create Invoice
          </Link>
        </div>
      </div>

      {loading && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      )}
      {!loading && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Search className="w-16 h-16 mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-700">No Invoices Found</h2>
          <p className="text-gray-500 max-w-sm mb-6">
            {searchTerm ? `We couldn't find any invoices matching "${searchTerm}". Try adjusting your search.` : "You haven’t created any invoices yet."}
          </p>
          {!searchTerm && (
            <Link
              href="/add-invoice"
              className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              + Create Invoice
            </Link>
          )}
        </div>
      )}
      {invoices.length > 0 && (
        <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-shadow duration-300 border-0 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-[#f8fafc] border-b border-gray-100">
              <tr>
                {['ID', 'Invoice #', 'Customer', 'Phone', 'Address', 'Total', 'Created At', 'Actions'].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {invoices.map((inv) => (
                <Fragment key={inv.id}>
                  <tr className="hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => toggleExpand(inv.id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{inv.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.invoiceNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{inv.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]" title={inv.address}>{inv.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-semibold">Rs {money(inv.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(inv.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 p-1.5 rounded-md"
                        title="View Invoice"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => router.push(`/edit-invoice/${inv.id}`)}
                        className="text-gray-400 hover:text-green-600 transition-colors bg-white hover:bg-green-50 p-1.5 rounded-md"
                        title="Edit Invoice"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-md"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded items */}
                  {expandedIds.includes(inv.id) && inv.items.length > 0 && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 p-5 mx-2 my-1">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Invoice Items</h4>
                          <ul className="space-y-2">
                            {inv.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                <div>
                                  <span className="font-semibold text-gray-800">{item.item_name}</span>
                                  {item.description && <span className="text-gray-500 ml-2">({item.description})</span>}
                                </div>
                                <div className="text-gray-600 font-medium">
                                  {item.quantity} {item.unit || ''} <span className="text-gray-400 mx-1">×</span> Rs {money(item.unit_price)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
          <div className="bg-white rounded-b-2xl overflow-hidden pb-1 pt-1 opacity-90">
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[6, 10, 25, 50]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoiceListPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <InvoiceListContent />
    </Suspense>
  );
}
