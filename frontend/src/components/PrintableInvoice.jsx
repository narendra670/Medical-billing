import React from 'react';
import dayjs from 'dayjs';

const PrintableInvoice = React.forwardRef(({ invoice }, ref) => {
    const { invoiceNumber, date, customer, items, subtotal, totalGst, grandTotal } = invoice;

    return (
        <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">SHREE GANESH MEDICAL STORE</h1>
                        <p className="text-lg mt-1">Lucknow, Uttar Pradesh</p>
                        <p className="text-sm">GSTIN: 09ABCDE1234F1Z5 • Phone: +91 98765 43210</p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black text-blue-700 tracking-widest">INVOICE</div>
                        <p className="mt-2 text-sm">#{invoiceNumber}</p>
                        <p className="text-sm">Date: {dayjs(date || Date.now()).format('DD MMMM YYYY')}</p>
                    </div>
                </div>
            </div>

            {/* Customer & Store Info */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Bill To</h3>
                    <p className="font-medium">{customer.name}</p>
                    <p>{customer.mobile}</p>
                    <p className="text-sm mt-1">{customer.address}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-700 mb-2">From</h3>
                    <p className="font-medium">Shree Ganesh Medical Store</p>
                    <p className="text-sm">Near Charbagh Railway Station, Lucknow</p>
                    <p className="text-sm">Uttar Pradesh - 226001</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-10">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-800">
                        <th className="text-left py-3 px-4">Medicine</th>
                        <th className="py-3 px-4">Batch</th>
                        <th className="py-3 px-4">Expiry</th>
                        <th className="text-right py-3 px-4">Qty</th>
                        <th className="text-right py-3 px-4">Price</th>
                        <th className="text-right py-3 px-4">GST%</th>
                        <th className="text-right py-3 px-4">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="py-4 px-4 font-medium">{item.medicineName}</td>
                            <td className="py-4 px-4 text-sm">{item.batchNumber}</td>
                            <td className="py-4 px-4 text-sm">
                                {item.expiryDate ? dayjs(item.expiryDate).format('MM/YYYY') : '-'}
                            </td>
                            <td className="py-4 px-4 text-right">{item.quantity}</td>
                            <td className="py-4 px-4 text-right">₹{(Number(item.price) || 0).toFixed(2)}</td>
                            <td className="py-4 px-4 text-right">{Number(item.gstPercent) || 0}%</td>
                            <td className="py-4 px-4 text-right font-medium">
                                ₹{item.total ? Number(item.total).toFixed(2) : ((Number(item.price) || 0) * (Number(item.quantity) || 0) * (1 + (Number(item.gstPercent) || 0) / 100)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-80">
                    <div className="flex justify-between py-2 border-b">
                        <span>Subtotal</span>
                        <span>₹{(Number(subtotal) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span>Total GST</span>
                        <span>₹{(Number(totalGst) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-4 text-xl font-bold border-b-2 border-gray-800">
                        <span>Grand Total</span>
                        <span>₹{(Number(grandTotal) || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center text-xs text-gray-500">
                <p>Thank you for your purchase! • Medicines are non-returnable after sale.</p>
                <p className="mt-4">This is a computer-generated invoice. No signature required.</p>
            </div>
        </div>
    );
});

export default PrintableInvoice;