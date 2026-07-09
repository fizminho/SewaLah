import { useState, useEffect } from 'react';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/client';
import { InvoiceModel } from '../types';
import UploadPaymentProofModal from '../components/Renter/UploadPaymentProofModal';
import InvoiceDetailModal from '../components/Common/InvoiceDetailModal';
import { formatDate } from '../utils/dateUtils';

interface PaymentRecord {
    id: string;
    invoiceId?: string;
    invoice?: { id: string };
    amountPaid: number;
    status?: string;
}

const RenterInvoices = () => {
    const { user } = useAuth();
    const [renterId, setRenterId] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<InvoiceModel[]>([]);
    const [payments, setPayments] = useState<Record<string, PaymentRecord[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

    const fetchInvoices = async () => {
        if (!renterId) return;
        setIsLoading(true);
        try {
            const [invoicesResult, paymentsResult] = await Promise.all([
                invoiceService.getMyInvoices(renterId),
                paymentService.getMyPayments(renterId),
            ]);

            setInvoices(invoicesResult.items || []);

            const paymentsByInvoice: Record<string, PaymentRecord[]> = {};
            (paymentsResult.items || []).forEach((p: any) => {
                const invoiceId = p.invoice_id || p.invoiceId;
                if (invoiceId) {
                    if (!paymentsByInvoice[invoiceId]) paymentsByInvoice[invoiceId] = [];
                    paymentsByInvoice[invoiceId].push({ id: p.id, invoiceId, amountPaid: p.amount_paid, status: p.status });
                }
            });
            setPayments(paymentsByInvoice);
        } catch (err: any) {
            setError('Failed to fetch invoices');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        db.from('renters').select('id').eq('email', user.email).single()
            .then(({ data }) => { if (data) setRenterId(data.id); });
    }, [user]);

    useEffect(() => { fetchInvoices(); }, [renterId, statusFilter]);

    const getTotalPaid = (invoiceId: string): number => {
        const invoicePayments = payments[invoiceId] || [];
        return invoicePayments
            .filter(p => p.status === 'Verified')
            .reduce((sum, p) => sum + p.amountPaid, 0);
    };

    const getInvoiceDisplayStatus = (invoice: InvoiceModel): { status: string; className: string } => {
        const totalPaid = getTotalPaid(invoice.id);
        
        if (invoice.status === 'Paid') {
            return { status: 'Paid', className: 'bg-green-50 text-[#107c10] border border-green-200' };
        }
        
        if (totalPaid > 0 && totalPaid < invoice.totalAmount) {
            return { status: 'Partial Paid', className: 'bg-yellow-50 text-[#ffb900] border border-yellow-200' };
        }
        
        if (invoice.status === 'Overdue') {
            return { status: 'Overdue', className: 'bg-red-50 text-[#d13438] border border-red-200' };
        }
        
        return { status: invoice.status, className: 'bg-yellow-50 text-[#ffb900] border border-yellow-200' };
    };

    useEffect(() => { fetchInvoices(); }, [renterId, statusFilter]);

    const handleUploadPayment = async (paymentData: any) => {
        if (!renterId || !selectedInvoice) return;
        try {
            await paymentService.record({
                invoiceId: selectedInvoice.id,
                renterId,
                amountPaid: Number(paymentData.amount),
                paymentDate: paymentData.paymentDate,
                paymentMethod: paymentData.paymentMethod,
                proofFile: paymentData.proof,
                notes: paymentData.referenceNumber,
            });
            alert('Payment proof submitted successfully!');
            fetchInvoices();
            setIsUploadModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to submit payment proof');
        }
    };

    const openUploadModal = (invoice: InvoiceModel) => {
        setSelectedInvoice(invoice);
        setIsUploadModalOpen(true);
    };

    const handleViewPdf = (pdfFilePath: string) => {
        window.open(pdfFilePath, '_blank');
    };

    const handleViewDetails = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#111827]">My Invoices</h1>
                    <p className="text-sm text-[#6b7280] mt-1">View and manage your rental invoices</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-[#d13438] text-[#d13438] px-4 py-3 rounded-lg" role="alert">
                    <span className="block sm:inline font-medium">{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl shadow-lg border border-[#e5e7eb]">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Status</label>
                        <select
                            className="border-[#d1d5db] rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-[#0078d4] focus:border-transparent transition-all"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Issued">Issued</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>
            </div>

            <UploadPaymentProofModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSave={handleUploadPayment}
                invoice={selectedInvoice}
            />

            <InvoiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                invoiceId={selectedInvoiceId}
            />

            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#e5e7eb]">
                {isLoading ? (
                    <div className="px-6 py-12 text-center text-[#6b7280]">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[#6b7280]">
                        No invoices found.
                    </div>
                ) : (
                    <ul className="divide-y divide-[#e5e7eb]">
                        {invoices.map((invoice) => (
                            <li key={invoice.id}>
                                <div className="px-6 py-5 hover:bg-[#f9fafb] transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-base font-bold text-[#0078d4]">{invoice.invoiceNumber}</p>
                                                <div className="ml-4 flex-shrink-0">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getInvoiceDisplayStatus(invoice).className}`}>
                                                        {getInvoiceDisplayStatus(invoice).status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-[#6b7280]">
                                                        📍 {invoice.property.name} - {invoice.unit.unitNumber}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <p className="text-sm text-[#6b7280]">
                                                        Due: <span className="font-semibold text-[#111827]">{formatDate(invoice.dueDate)}</span>
                                                    </p>
                                                    <p className="text-lg font-bold text-[#111827]">
                                                        RM {invoice.totalAmount.toLocaleString()}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        {(invoice.status === 'Issued' || invoice.status === 'Overdue') && (
                                                            <button 
                                                                onClick={() => openUploadModal(invoice)}
                                                                className="px-4 py-2 bg-gradient-to-r from-[#0078d4] to-[#0063b1] text-white rounded-lg text-xs font-semibold hover:from-[#0063b1] hover:to-[#004a8e] transition-all shadow-md"
                                                            >
                                                                Upload Payment
                                                            </button>
                                                        )}
                                                        {(invoice as any).pdfFilePath && (
                                                            <button 
                                                                onClick={() => handleViewPdf((invoice as any).pdfFilePath)}
                                                                className="px-4 py-2 bg-[#f0f6ff] text-[#0078d4] rounded-lg text-xs font-semibold hover:bg-[#e0ecff] transition-colors border border-[#c1d9ff]"
                                                            >
                                                                View PDF
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleViewDetails(invoice.id)}
                                                            className="px-4 py-2 bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold hover:bg-[#f3f4f6] transition-colors border border-[#e5e7eb]"
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RenterInvoices;
