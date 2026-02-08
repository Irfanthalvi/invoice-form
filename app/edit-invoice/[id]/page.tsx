'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

interface InvoiceItem {
  item_name: string;
  unit?: string;
  quantity: number | string;
  unit_price: number | string;
}

interface InvoiceData {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string;
  items: InvoiceItem[];
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get<{ data: InvoiceData }>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${params.id}`
      );
      const data = res.data.data;
      setInvoice(data);
      setCustomerName(data.customer_name);
      setPhone(data.customer_phone);
      setAddress(data.customer_address);
      setNotes(data.notes);
      setItems(
        data.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const handleItemChange = (index: number, key: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index][key] =
      key === 'quantity' || key === 'unit_price' ? Number(value) : value;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { item_name: '', unit: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const formatMoney = (v: number | string) => Number(v || 0).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Updating invoice...');
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${params.id}`, {
        customer_name: customerName,
        customer_phone: phone,
        customer_address: address,
        notes,
        items,
      });
      toast.success('Invoice updated successfully!', { id: loadingToast });
      router.push(`/invoices/${params.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update invoice', { id: loadingToast });
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-500 text-lg">Loading invoice...</div>;
  if (!invoice)
    return <div className="text-center py-20 text-red-500 text-lg">Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 bg-white dark:bg-gray-300 rounded-xl shadow-md text-gray-900 dark:text-white font-sans">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-6 text-center">Edit Invoice #{invoice.invoice_number}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Info */}
        <div className="flex justify-between mb-8 text-lg">
          <div className="flex flex-col w-1/2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2 py-1 rounded w-full bg-white dark:bg-gray-300 dark:text-white"
              placeholder="Customer Name"
              required
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-2 py-1 rounded w-full bg-white dark:bg-gray-300 dark:text-white"
              placeholder="Phone Number"
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="px-2 py-1 rounded w-full bg-white dark:bg-gray-300 dark:text-white"
              placeholder="Address"
            />
          </div>
          <div className="text-right">
            <p className="font-semibold">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300 dark:border-white">
                {['Item','Quantity','Unit Price','Total',''].map((h) => (
                  <th key={h} className="py-3 px-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-300">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(i,'item_name',e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                      required
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i,'quantity',e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(i,'unit_price',e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(Number(item.quantity)*Number(item.unit_price))}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="mt-4 px-4 py-2 border border-gray-300 dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          + Add Item
        </button>

        {/* Total */}
        <div className="flex justify-end gap-10 text-right mb-10 mt-4">
          <div>
            <p className="font-semibold">Total</p>
            <p className="bg-gray-900 text-white px-4 py-2 rounded inline-block text-lg font-bold">
              {formatMoney(total)}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 dark:border-white rounded px-3 py-2 bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
            rows={3}
            placeholder="Notes..."
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-black hover:bg-black disabled:opacity-60 text-white px-4 py-2 rounded-md"
          >
            Update Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
