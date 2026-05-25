import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const InvoiceList = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get('/api/invoices');
            setInvoices(res.data);
        } catch (err) {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (invoice) => {
        setDownloadingId(invoice._id);
        try {
            const response = await axios.get(`/api/invoices/${invoice._id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded!');
        } catch (error) {
            toast.error('Failed to download PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const openPDF = async (invoice) => {
        setDownloadingId(invoice._id);
        try {
            const response = await axios.get(`/api/invoices/${invoice._id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
            toast.success('PDF opened in new tab');
        } catch (error) {
            toast.error('Failed to open PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-blue-700 text-white p-6 md:p-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Invoice History</h1>
                        <p className="text-blue-100 mt-1 text-sm">View and download past invoices</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
                        >
                            + New Invoice
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

            <div className="max-w-6xl mx-auto p-6">
                {loading ? (
                    <div className="text-center py-20">
                        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="mt-4 text-gray-500">Loading invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <div className="text-6xl mb-4">📄</div>
                        <h2 className="text-xl font-semibold text-gray-700">No invoices yet</h2>
                        <p className="text-gray-500 mt-2">Create your first invoice to get started</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-2xl font-medium transition cursor-pointer"
                        >
                            Create Invoice
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {invoices.map((inv) => (
                            <div key={inv._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                                            {inv.invoiceNumber}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            {dayjs(inv.createdAt).format('DD MMM YYYY, h:mm A')}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-4 flex-wrap text-sm">
                                        <span className="font-medium text-gray-800">{inv.customer?.name}</span>
                                        <span className="text-gray-500">{inv.customer?.mobile}</span>
                                        <span className="text-gray-500">{inv.items?.length} item{inv.items?.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-blue-700 whitespace-nowrap">
                                        ₹{(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={() => openPDF(inv)}
                                        disabled={downloadingId === inv._id}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
                                        title="Open PDF"
                                    >
                                        {downloadingId === inv._id ? (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : 'View'}
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(inv)}
                                        disabled={downloadingId === inv._id}
                                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingId === inv._id ? (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : 'Download'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
