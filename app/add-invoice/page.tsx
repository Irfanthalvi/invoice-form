'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';

interface InvoiceItem {
  item_name: string;
  unit: string;
  quantity: number | string;
  unit_price: number | string;
}

export default function AddInvoice() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { item_name: '', unit: '', quantity: 1, unit_price: 0 },
  ]);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const formatMoney = (v: number | string) => Number(v || 0).toFixed(2);

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
    if (items.length === 1) {
      toast.error('Cannot remove the last item ❌');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'Create Invoice?',
      text: 'Do you want to save this invoice?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    const loadingToast = toast.loading('Saving invoice...');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/invoices`,
        {
          customer_name: customerName,
          customer_phone: phone,
          customer_address: address,
          notes,
          items,
        }
      );

      toast.dismiss(loadingToast);
      toast.success('Invoice created successfully 🎉');

      const newInvoiceId = response.data.id || response.data.data?.id;
      if (newInvoiceId) {
        router.push(`/invoices/${newInvoiceId}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error('Failed to create invoice ❌');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 bg-white dark:bg-gray-300 rounded-xl shadow-md text-gray-900 dark:text-white font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold rounded">
            JS
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold">Add Invoice</h1>
      </div>

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
                {['Item', 'Quantity', 'Unit Price', 'Total', ''].map((h) => (
                  <th key={h} className="py-3 px-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-300"
                >
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(i, 'item_name', e.target.value)}
                      className="w-full dark:border-white px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td>
                  {/* <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(i, 'unit', e.target.value)}
                      className="w-full dark:border-white px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td> */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                      className="w-full dark:border-white px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                      className="w-full dark:border-white px-2 py-1 rounded bg-white dark:bg-gray-300 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(Number(item.quantity) * Number(item.unit_price))}</td>
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

        {/* Totals */}
        <div className="flex justify-end gap-10 text-right mb-10 mt-4">
          <div>
            <p className="font-semibold">Total</p>
            <p className="bg-gray-900 text-white px-4 py-2 rounded inline-block text-lg font-bold">
              {formatMoney(subtotal)}
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
            className="flex items-center gap-2 bg-black cursor-pointer hover:bg-black disabled:opacity-60 text-white px-4 py-2 rounded-md"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
