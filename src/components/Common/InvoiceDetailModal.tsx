import { useState, useEffect } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { formatDate } from '../../utils/dateUtils';

interface InvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
}

const InvoiceDetailModal = ({ isOpen, onClose, invoiceId }: InvoiceDetailModalProps) => {
    const [invoice, setInvoice] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchInvoiceDetails();
        }
    }, [isOpen, invoiceId]);

    const fetchInvoiceDetails = async () => {
        setIsLoading(true);
        try {
            const data = await invoiceService.getById(invoiceId);
            // Normalize field names from snake_case to camelCase for display
            setInvoice({
                ...data,
                invoiceNumber: data.invoice_number,
                totalAmount: data.total_amount,
                dueDate: data.due_date,
                renter: data.renters ? { fullName: data.renters.full_name } : null,
                property: data.units?.properties ? { name: data.units.properties.name } : null,
                unit: data.units ? { unitNumber: data.units.unit_number } : null,
                lineItems: (data.invoice_line_items || []).map((li: any) => ({
                    id: li.id,
                    itemType: li.item_type,
                    description: li.description,
                    amount: li.amount,
                    quantity: li.quantity,
                })),
                payments: (data.payments || []).map((p: any) => ({
                    id: p.id,
                    transactionNumber: p.transaction_number,
                    amountPaid: p.amount_paid,
                    paymentDate: p.payment_date,
                    paymentMethod: p.payment_method,
                    status: p.status,
                    proofFilePath: p.proof_file_path,
                })),
            });
        } catch (err) {
            console.error('Failed to fetch invoice details', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewPdf = (pdfFilePath: string) => {
        window.open(pdfFilePath, '_blank');
    };

    const handleViewProof = (proofFilePath: string) => {
        window.open(proofFilePath, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Invoice Details
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">Complete invoice information</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-16">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-sm text-gray-600">Loading...</p>
                            </div>
                        ) : invoice ? (
                            <div className="space-y-6">
                                {/* Invoice Info */}
                                <div className="grid grid-cols-2 gap-5 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Invoice Number</p>
                                        <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Status</p>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Renter</p>
                                        <p className="font-semibold text-gray-900">{invoice.renter.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Property / Unit</p>
                                        <p className="font-semibold text-gray-900">{invoice.property.name} - {invoice.unit.unitNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Total Amount</p>
                                        <p className="font-bold text-xl text-gray-900">RM {invoice.totalAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Due Date</p>
                                        <p className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
                                    </div>
                                </div>

                                {/* Invoice PDF */}
                                {invoice.pdfFilePath && (
                                    <div className="border-t border-gray-200 pt-5">
                                        <button
                                            onClick={() => handleViewPdf(invoice.pdfFilePath)}
                                            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-5 py-3.5 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center font-semibold shadow-sm hover:shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            View Invoice PDF
                                        </button>
                                    </div>
                                )}

                                {/* Line Items */}
                                <div className="border-t border-gray-200 pt-5">
                                    <h4 className="font-semibold text-gray-900 mb-4">Line Items</h4>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                <tr>
                                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-900">Description</th>
                                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-900">Qty</th>
                                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-900">Amount</th>
                                            </tr>
                                        </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoice.lineItems.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-5 py-3 text-sm text-gray-900">{item.itemType} {item.description && `- ${item.description}`}</td>
                                                        <td className="px-5 py-3 text-sm text-right text-gray-900">{item.quantity}</td>
                                                        <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">RM {(item.amount * item.quantity).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Payments */}
                                {invoice.payments && invoice.payments.length > 0 && (
                                    <div className="border-t border-gray-200 pt-5">
                                        <h4 className="font-semibold text-gray-900 mb-4">Payments</h4>
                                        <div className="space-y-3">
                                            {invoice.payments.map((payment: any) => (
                                                <div key={payment.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-600 mb-1">{payment.transactionNumber}</p>
                                                        <p className="text-sm font-semibold text-gray-900">RM {payment.amountPaid.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {formatDate(payment.paymentDate)} - {payment.paymentMethod}
                                                        </p>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            payment.status === 'Verified' ? 'bg-green-100 text-green-800' :
                                                            payment.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {payment.status}
                                                        </span>
                                                    </div>
                                                    {payment.proofFilePath && (
                                                        <button
                                                            onClick={() => handleViewProof(payment.proofFilePath)}
                                                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            View Proof
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500">
                                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No invoice data</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-8 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
