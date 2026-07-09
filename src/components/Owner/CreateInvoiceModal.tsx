import { useState, useEffect } from 'react';
import { renterService } from '../../services/renterService';
import CustomSelect from '../Common/CustomSelect';
import DatePicker from '../Common/DatePicker';
import { formatCurrency } from '../../utils/currencyUtils';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: any) => void;
}

interface LineItem {
    type: number; // ItemType enum: 0=Rent, 1=Utility, 2=Maintenance, 3=Other
    description: string;
    amount: number;
    quantity: number;
}

const CreateInvoiceModal = ({ isOpen, onClose, onSave }: CreateInvoiceModalProps) => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueDateError, setDueDateError] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { type: 0, description: 'Monthly Rent', amount: 0, quantity: 1 }
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchAssignments();
        }
    }, [isOpen]);

    const fetchAssignments = async () => {
        try {
            const result = await renterService.getAll();
            const allAssignments = (result.items || []).flatMap((r: any) =>
                (r.activeAssignments || r.renter_unit_assignments || []).map((a: any) => ({
                    ...a,
                    renterName: r.fullName || r.full_name,
                    propertyName: a.units?.properties?.name ?? '',
                    unitNumber: a.units?.unit_number ?? a.unitNumber ?? '',
                }))
            );
            setAssignments(allAssignments);
        } catch (err) {
            console.error('Failed to fetch assignments', err);
        }
    };

    const handleAssignmentChange = (value: string) => {
        setSelectedAssignmentId(value);
        const assignment = assignments.find(a => a.id === value);
        if (assignment) {
            const newLineItems = [...lineItems];
            const rentItem = newLineItems.find(li => li.type === 0);
            if (rentItem) {
                rentItem.amount = assignment.monthlyRent;
                setLineItems(newLineItems);
            }
        }
    };

    const handleAddLineItem = () => {
        setLineItems([...lineItems, { type: 3, description: '', amount: 0, quantity: 1 }]);
    };

    const handleRemoveLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
        const newLineItems = [...lineItems];
        (newLineItems[index] as any)[field] = value;
        setLineItems(newLineItems);
    };

    const validateForm = () => {
        let isValid = true;
        if (!dueDate) {
            setDueDateError('Due date is required');
            isValid = false;
        } else {
            setDueDateError('');
        }
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            await onSave({
                assignmentId: selectedAssignmentId,
                dueDate,
                notes,
                lineItems: lineItems.map(li => ({
                    type: li.type,
                    description: li.description,
                    amount: li.amount,
                    quantity: li.quantity
                }))
            });
            resetForm();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedAssignmentId('');
        setDueDate('');
        setNotes('');
        setLineItems([{ type: 0, description: 'Monthly Rent', amount: 0, quantity: 1 }]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900" id="modal-title">
                                        Create New Invoice
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Generate invoice for renter</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-full">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="assignment" className="block text-xs font-semibold text-gray-700 mb-2">Renter / Unit</label>
                                                <CustomSelect
                                                    options={[
                                                        { value: '', label: 'Select Assignment' },
                                                        ...assignments.map(a => ({
                                                            value: a.id,
                                                            label: `${a.renterName} - ${a.propertyName} (${a.unitNumber})`
                                                        }))
                                                    ]}
                                                    value={selectedAssignmentId}
                                                    onChange={handleAssignmentChange}
                                                    placeholder="Select assignment"
                                                />
                                            </div>
                                            <div>
                                                <DatePicker
                                                    label="Due Date"
                                                    value={dueDate}
                                                    onChange={setDueDate}
                                                    required
                                                    placeholder="Select due date"
                                                    error={dueDateError}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="block text-xs font-semibold text-gray-700">Line Items</label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddLineItem}
                                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    + Add Item
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {lineItems.map((item, index) => (
                                                    <div key={index} className="flex gap-2 items-start p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                                        <CustomSelect
                                                            options={[
                                                                { value: '0', label: 'Rent' },
                                                                { value: '1', label: 'Utility' },
                                                                { value: '2', label: 'Maintenance' },
                                                                { value: '3', label: 'Other' },
                                                            ]}
                                                            value={item.type.toString()}
                                                            onChange={(value) => handleLineItemChange(index, 'type', parseInt(value))}
                                                            placeholder="Type"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            className="block w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                            value={item.description}
                                                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Amount"
                                                            className="block w-1/4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                            value={item.amount}
                                                            onChange={(e) => handleLineItemChange(index, 'amount', parseFloat(e.target.value))}
                                                        />
                                                        {lineItems.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveLineItem(index)}
                                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 mb-2">Notes</label>
                                            <textarea
                                                id="notes"
                                                rows={3}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex justify-end items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-gray-600 mb-1">Total Amount</p>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0))}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 sm:px-6 lg:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto inline-flex justify-center items-center px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Draft'
                                )}
                            </button>
                            <button
                                type="button"
                                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-4 lg:px-6 py-2 lg:py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
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

export default CreateInvoiceModal;
