import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/client';
import dayjs from 'dayjs';
import PrintableInvoice from '../components/PrintableInvoice';

const CreateInvoice = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const printRef = useRef();

    const [customer, setCustomer] = useState({
        name: '', mobile: '', address: ''
    });

    const [items, setItems] = useState([{
        medicineName: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 1,
        price: 0,
        gstPercent: 12
    }]);

    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);

    const [subtotal, setSubtotal] = useState(0);
    const [totalGst, setTotalGst] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [savedInvoice, setSavedInvoice] = useState(null);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const calculateTotals = () => {
        let sub = 0, gstTotal = 0;
        items.forEach(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const gst = Number(item.gstPercent) || 0;
            const itemTotal = price * qty;
            sub += itemTotal;
            gstTotal += (itemTotal * gst) / 100;
        });
        setSubtotal(sub);
        setTotalGst(gstTotal);
        setGrandTotal(sub + gstTotal);
    };

    useEffect(() => { calculateTotals(); }, [items]);

    const searchMedicine = async (searchTerm, index) => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }
        setActiveRowIndex(index);
        try {
            const res = await api.get(`/api/invoices/medicines/search?name=${encodeURIComponent(searchTerm)}`);
            const results = res.data.medicines || [];
            setSearchResults(results.map(item => ({
                displayName: item.display_name || 'Unknown',
                genericName: item.generic_name || '',
            })));
            setShowSuggestions(true);
        } catch {
            setSearchResults([]);
        }
    };

    const selectMedicine = (index, med) => {
        const updated = [...items];
        updated[index] = { ...updated[index], medicineName: med.displayName, price: 0, gstPercent: 12 };
        setItems(updated);
        setShowSuggestions(false);
        setSearchResults([]);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        if (['quantity', 'price', 'gstPercent'].includes(field)) {
            updated[index][field] = value === '' ? '' : Number(value);
        } else {
            updated[index][field] = value;
        }
        setItems(updated);
    };

    const addRow = () => {
        setItems([...items, { medicineName: '', batchNumber: '', expiryDate: '', quantity: 1, price: 0, gstPercent: 12 }]);
    };

    const removeRow = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleMobileSearch = async () => {
        if (!customer.mobile) return;
        try {
            const res = await api.get(`/api/customers?mobile=${customer.mobile}`);
            if (res.data) {
                setCustomer({ name: res.data.name || '', mobile: res.data.mobile || '', address: res.data.address || '' });
                toast.success('Customer found!');
            }
        } catch {
            toast.error('Customer not found. Enter details manually.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customer.name || !customer.mobile) {
            toast.error('Please fill customer name and mobile');
            return;
        }
        if (items.some(item => !item.medicineName || item.price <= 0)) {
            toast.error('Please fill all required fields (Medicine + Price)');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/api/invoices', { customer, items });
            toast.success('Invoice saved!');
            setSavedInvoice(res.data);

            setCustomer({ name: '', mobile: '', address: '' });
            setItems([{ medicineName: '', batchNumber: '', expiryDate: '', quantity: 1, price: 0, gstPercent: 12 }]);

            setTimeout(() => setShowPreview(true), 300);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save invoice');
        } finally {
            setSaving(false);
        }
    };

    const generatePDF = async () => {
        if (!savedInvoice) return;
        setDownloading(true);
        try {
            const response = await api.get(`/api/invoices/${savedInvoice._id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${savedInvoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded!');
        } catch {
            toast.error('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    const openPDF = async () => {
        if (!savedInvoice) return;
        setDownloading(true);
        try {
            const response = await api.get(`/api/invoices/${savedInvoice._id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
            toast.success('PDF opened');
        } catch {
            toast.error('Failed to open PDF');
        } finally {
            setDownloading(false);
        }
    };

    const newInvoice = () => {
        setSavedInvoice(null);
        setShowPreview(false);
        setCustomer({ name: '', mobile: '', address: '' });
        setItems([{ medicineName: '', batchNumber: '', expiryDate: '', quantity: 1, price: 0, gstPercent: 12 }]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-blue-700 text-white p-6 md:p-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Medical Store Billing</h1>
                        <p className="text-blue-100 mt-1 text-sm">Shree Ganesh Medical Store • Lucknow, UP</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {user?.name && (
                            <span className="hidden md:block text-blue-200 text-sm">Hi, {user.name}</span>
                        )}
                        <button
                            onClick={() => navigate('/invoices')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            History
                        </button>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-6">
                {!savedInvoice || !showPreview ? (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                        <div className="p-6 md:p-8">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Mobile</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={customer.mobile}
                                                onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                                                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="9876543210"
                                            />
                                            <button type="button" onClick={handleMobileSearch}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-medium text-sm transition cursor-pointer">
                                                Find
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name</label>
                                        <input type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                                        <input type="text" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                                    </div>
                                </div>

                                <div className="flex justify-between mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                                    <div><strong>Invoice:</strong> <span className="text-blue-700">Auto-generated on save</span></div>
                                    <div><strong>Date:</strong> {dayjs().format('DD MMMM YYYY')}</div>
                                </div>

                                <div className="overflow-x-auto mb-6">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="p-3 text-left text-sm">Medicine</th>
                                                <th className="p-3 text-center text-sm">Batch</th>
                                                <th className="p-3 text-center text-sm">Expiry</th>
                                                <th className="p-3 text-center text-sm">Qty</th>
                                                <th className="p-3 text-right text-sm">Price (₹)</th>
                                                <th className="p-3 text-center text-sm">GST %</th>
                                                <th className="p-3 text-right text-sm">Amount (₹)</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 relative">
                                                        <input type="text" value={item.medicineName}
                                                            onChange={(e) => {
                                                                handleItemChange(index, 'medicineName', e.target.value);
                                                                searchMedicine(e.target.value, index);
                                                            }}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Medicine name" required />
                                                        {showSuggestions && activeRowIndex === index && searchResults.length > 0 && (
                                                            <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-48 overflow-auto">
                                                                {searchResults.map((med, i) => (
                                                                    <div key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                                                        onClick={() => selectMedicine(index, med)}>
                                                                        <div className="font-medium text-sm">{med.displayName}</div>
                                                                        {med.genericName && <div className="text-xs text-gray-500">{med.genericName}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="text" value={item.batchNumber} onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl px-2 py-2.5 text-center text-sm" placeholder="-" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl px-2 py-2.5 text-sm" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl px-2 py-2.5 text-center text-sm" min="1" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl px-2 py-2.5 text-right text-sm" step="0.01" min="0" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={item.gstPercent} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-xl px-2 py-2.5 text-center text-sm" min="0" max="28" />
                                                    </td>
                                                    <td className="p-2 font-semibold text-right text-sm">
                                                        ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0) * (1 + (Number(item.gstPercent) || 0) / 100)).toFixed(2)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {items.length > 1 && (
                                                            <button type="button" onClick={() => removeRow(index)}
                                                                className="text-red-500 hover:text-red-700 text-lg font-bold cursor-pointer">×</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-wrap gap-3 mb-6">
                                    <button type="button" onClick={addRow}
                                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer">
                                        + Add Item
                                    </button>
                                </div>

                                <div className="flex justify-end mb-8">
                                    <div className="w-full md:w-80 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Total GST:</span> <span>₹{totalGst.toFixed(2)}</span></div>
                                            <div className="flex justify-between border-t border-gray-300 pt-3 text-xl font-bold text-blue-700">
                                                <span>Grand Total:</span> <span>₹{grandTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={saving}
                                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-2xl text-lg font-semibold transition cursor-pointer disabled:cursor-not-allowed">
                                    {saving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving Invoice...
                                        </span>
                                    ) : 'Save Invoice'}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : null}

                {savedInvoice && showPreview && (
                    <div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-sm text-gray-500">Invoice</span>
                                <span className="ml-2 font-semibold text-blue-700">{savedInvoice.invoiceNumber}</span>
                                <span className="ml-4 text-sm text-gray-500">
                                    ₹{(savedInvoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={newInvoice}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer">
                                    + New Invoice
                                </button>
                                <button onClick={openPDF} disabled={downloading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer disabled:cursor-not-allowed">
                                    {downloading ? 'Loading...' : 'View PDF'}
                                </button>
                                <button onClick={generatePDF} disabled={downloading}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer disabled:cursor-not-allowed">
                                    {downloading ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Downloading...
                                        </span>
                                    ) : 'Download PDF'}
                                </button>
                            </div>
                        </div>

                        <div className="hidden">
                            <PrintableInvoice ref={printRef} invoice={savedInvoice} />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <PrintableInvoice invoice={savedInvoice} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateInvoice;