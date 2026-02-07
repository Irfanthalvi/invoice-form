'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast'; // ✅ Import Hot Toast

interface Item {
  item_name: string;
  quantity: number | string;
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

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get<{ data: Invoice }>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${params.id}`
        );
        const data = res.data.data;
        setInvoice(data);
        setCustomerName(data.customer_name);
        setPhone(data.customer_phone);
        setAddress(data.customer_address);
        setDiscount(Number(data.discount));
        setNotes(data.notes);
        setItems(data.items);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch invoice'); // ✅ Toast on error
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [params.id]);

  const formatMoney = (v: number | string) => Number(v || 0).toFixed(2);

  const handleItemChange = (index: number, key: keyof Item, value: any) => {
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

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const totalAmount = subtotal - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Updating invoice...'); // ✅ Show loading toast
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${params.id}`, {
        customer_name: customerName,
        customer_phone: phone,
        customer_address: address,
        discount,
        notes,
        items,
      });
      toast.success('Invoice updated successfully!', { id: loadingToastId }); // ✅ Success toast
      router.push(`/invoices/${params.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update invoice', { id: loadingToastId }); // ✅ Error toast
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 text-lg">Loading invoice...</div>;
  if (!invoice) return <div className="text-center py-20 text-red-500 text-lg">Invoice not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 bg-white shadow-lg rounded-lg">
      <Toaster position="top-right" reverseOrder={false} /> {/* ✅ Hot Toast container */}

      {/* Heading */}
      <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">
        Edit Invoice #{invoice.invoice_number}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="font-semibold">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="font-semibold">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 border-collapse rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  {['Item', 'Unit', 'Qty', 'Unit Price', 'Total', ''].map((h) => (
                    <th key={h} className="px-4 py-2 border border-gray-300 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(i, 'item_name', e.target.value)}
                        className="w-full border px-2 py-1 rounded"
                        required
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(i, 'unit', e.target.value)}
                        className="w-full border px-2 py-1 rounded"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                        className="w-full border px-2 py-1 rounded"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                        className="w-full border px-2 py-1 rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 font-semibold">
                      {formatMoney(Number(item.quantity) * Number(item.unit_price))}
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(i)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
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
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        {/* Summary */}
        <div className="flex justify-end gap-6 text-right">
          <div>
            <label className="font-semibold">Subtotal:</label>
            <p className="font-bold">{formatMoney(subtotal)}</p>
          </div>
          <div>
            <label className="font-semibold">Discount:</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-24 border px-2 py-1 rounded text-right"
            />
          </div>
          <div>
            <label className="font-semibold">Total:</label>
            <p className="text-xl font-extrabold text-blue-600">{formatMoney(totalAmount)}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-semibold">Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Update Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
