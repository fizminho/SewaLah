import { useState, useEffect } from 'react';
import { InvoiceModel } from '../../types';
import CustomSelect from '../Common/CustomSelect';
import { formatDateInput } from '../../utils/dateUtils';

interface UploadPaymentProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    invoice: InvoiceModel | null;
}

const UploadPaymentProofModal = ({ isOpen, onClose, onSave, invoice }: UploadPaymentProofModalProps) => {
    const [paymentDate, setPaymentDate] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BankTransfer');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [proof, setProof] = useState<File | null>(null);
    const [amountError, setAmountError] = useState('');

    useEffect(() => {
        if (invoice) {
            setAmount(invoice.outstandingAmount.toString());
            setPaymentDate(formatDateInput(new Date()));
        }
    }, [invoice]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!proof) {
            alert('Please upload payment proof');
            return;
        }
        
        const amountValue = parseFloat(amount);
        if (invoice && amountValue > invoice.outstandingAmount) {
            setAmountError(`Amount cannot exceed outstanding balance of ${invoice.outstandingAmount.toFixed(2)}`);
            return;
        }
        
        onSave({
            invoiceId: invoice?.id,
            paymentDate,
            amount: amountValue,
            paymentMethod,
            referenceNumber,
            proof
        });
        handleClose();
    };

    const handleClose = () => {
        setPaymentDate('');
        setAmount('');
        setPaymentMethod('BankTransfer');
        setReferenceNumber('');
        setProof(null);
        setAmountError('');
        onClose();
    };

    if (!isOpen || !invoice) return null;

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" onClick={handleClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Upload Payment Proof
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Submit payment evidence for verification</p>
                                </div>
                                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-700">Invoice: <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span></p>
                                <p className="text-sm text-gray-700 mt-1">Amount Due: <span className="font-semibold text-gray-900">RM {invoice.outstandingAmount.toLocaleString()}</span></p>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Date *</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Amount Paid (RM) * (Max: {invoice.outstandingAmount.toFixed(2)})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={invoice.outstandingAmount}
                                        value={amount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const num = parseFloat(val);
                                            if (!isNaN(num) && num <= 99999.99 && /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                                                setAmount(val);
                                                setAmountError('');
                                            } else if (val === '') {
                                                setAmount('');
                                                setAmountError('');
                                            }
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
                                            amountError ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        required
                                    />
                                    {amountError && (
                                        <p className="text-xs text-red-600 mt-1">{amountError}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Method *</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'BankTransfer', label: 'Bank Transfer' },
                                            { value: 'Cash', label: 'Cash' },
                                            { value: 'Cheque', label: 'Cheque' },
                                            { value: 'Other', label: 'Other' },
                                        ]}
                                        value={paymentMethod}
                                        onChange={setPaymentMethod}
                                        placeholder="Select method"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Reference Number</label>
                                    <input
                                        type="text"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="Transaction reference (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Proof *</label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => setProof(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Accepted: JPG, PNG, PDF (Max 10MB)</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all"
                            >
                                Submit Payment
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadPaymentProofModal;
