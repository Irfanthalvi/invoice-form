'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface InvoiceItem {
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export default function AddInvoice() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { item_name: '', unit: '', quantity: 1, unit_price: 0 },
  ]);

  // Auto calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const totalAmount = subtotal - discount;

  const handleItemChange = (
    index: number,
    key: keyof InvoiceItem,
    value: string | number
  ) => {
  const newItems = [...items];
  newItems[index] = {
    ...newItems[index],
    [key]: key === 'quantity' || key === 'unit_price' ? Number(value) : String(value),
  };
  setItems(newItems);
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

  if (!result.isConfirmed) return; // ✅ use result.isConfirmed

  const loadingToast = toast.loading('Saving invoice...');

  try {
    // Send invoice data to backend
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/invoices`, {
      customer_name: customerName,
      customer_phone: phone,
      customer_address: address,
      discount,
      notes,
      items,
    });

    toast.dismiss(loadingToast);
    toast.success('Invoice created successfully 🎉');

    // Redirect to the newly created invoice page
    const newInvoiceId = response.data.id || response.data.data?.id; // depends on your backend
    if (newInvoiceId) {
      router.push(`/invoices/${newInvoiceId}`);
    } else {
      router.push('/'); // fallback
    }

  } catch (err) {
    toast.dismiss(loadingToast);
    console.error(err);
    toast.error('Failed to create invoice ❌');
  }
};

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 bg-white shadow-lg rounded-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Add Invoice</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ali Traders"
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Lahore"
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <label className="mb-2 font-medium text-gray-700 block">Items</label>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-center">
              <input
                type="text"
                value={item.item_name}
                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                placeholder="Item Name"
                className="border px-2 py-1 rounded-lg col-span-2 focus:outline-none focus:ring focus:ring-blue-200"
                required
              />

              <input
                type="text"
                value={item.unit}
                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                placeholder="Unit"
                className="border px-2 py-1 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              />

              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                placeholder="Qty"
                className="border px-2 py-1 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              />

              <input
                type="number"
                value={item.unit_price}
                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                placeholder="Unit Price"
                className="border px-2 py-1 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              />

              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 flex justify-center"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="mb-1 font-medium text-gray-700 block">Subtotal</label>
            <input value={subtotal} readOnly className="border px-3 py-2 rounded-lg bg-gray-100" />
          </div>

          <div>
            <label className="mb-1 font-medium text-gray-700 block">Discount</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-1 font-medium text-gray-700 block">Total Amount</label>
            <input value={totalAmount} readOnly className="border px-3 py-2 rounded-lg bg-gray-100" />
          </div>
        </div>

        <div>
          <label className="mb-1 font-medium text-gray-700 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow mt-4 w-fit"
        >
          Add Invoice
        </button>
      </form>
    </div>
  );
}
