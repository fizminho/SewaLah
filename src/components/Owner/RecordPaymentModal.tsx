import { useState } from 'react';
import CustomSelect from '../Common/CustomSelect';
import DatePicker from '../Common/DatePicker';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: any) => void;
    invoiceNumber?: string;
    maxAmount?: number;
}

const RecordPaymentModal = ({ isOpen, onClose, onSave, invoiceNumber = '', maxAmount = 0 }: RecordPaymentModalProps) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('BankTransfer');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [dateError, setDateError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const validateForm = () => {
        let isValid = true;
        
        if (!date) {
            setDateError('Payment date is required');
            isValid = false;
        } else {
            setDateError('');
        }
        
        const amountValue = parseFloat(amount);
        if (!amount || amountValue <= 0) {
            setAmountError('Amount must be greater than 0');
            isValid = false;
        } else if (amountValue > maxAmount) {
            setAmountError(`Amount cannot exceed remaining balance of ${maxAmount.toFixed(2)}`);
            isValid = false;
        } else {
            setAmountError('');
        }
        
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            await onSave({ amount: parseFloat(amount), method, date, notes });
            setAmount('');
            setMethod('BankTransfer');
            setDate('');
            setNotes('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900" id="modal-title">
                                        Record Payment
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Record manual payment transaction</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-full">
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="invoiceId" className="block text-xs font-semibold text-gray-700 mb-2">Invoice #</label>
                                            <input
                                                type="text"
                                                name="invoiceId"
                                                id="invoiceId"
                                                disabled
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                                value={invoiceNumber}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="amount" className="block text-xs font-semibold text-gray-700 mb-2">
                                                Amount Paid (Max: {maxAmount.toFixed(2)})
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                id="amount"
                                                min="0"
                                                max={maxAmount}
                                                step="0.01"
                                                required
                                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
                                                    amountError ? 'border-red-500' : 'border-gray-200'
                                                }`}
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
                                            />
                                            {amountError && (
                                                <p className="text-xs text-red-600 mt-1">{amountError}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="method" className="block text-xs font-semibold text-gray-700 mb-2">Payment Method</label>
                                            <CustomSelect
                                                options={[
                                                    { value: 'BankTransfer', label: 'Bank Transfer' },
                                                    { value: 'Cash', label: 'Cash' },
                                                    { value: 'Cheque', label: 'Cheque' },
                                                ]}
                                                value={method}
                                                onChange={setMethod}
                                                placeholder="Select method"
                                            />
                                        </div>
                                        <div>
                                            <DatePicker
                                                label="Payment Date"
                                                value={date}
                                                onChange={setDate}
                                                required
                                                placeholder="Select payment date"
                                                error={dateError}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                                            <textarea
                                                name="notes"
                                                id="notes"
                                                rows={3}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any additional notes..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Proof of Payment (Optional)</label>
                                            <div className="flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="space-y-1 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <div className="flex text-sm text-gray-600">
                                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-lg font-medium text-blue-600 hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-600 px-3 py-1.5">
                                                            <span>Upload a file</span>
                                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                                        </label>
                                                        <p className="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Recording...
                                    </>
                                ) : (
                                    'Record'
                                )}
                            </button>
                            <button
                                type="button"
                                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                onClick={onClose}
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

export default RecordPaymentModal;
