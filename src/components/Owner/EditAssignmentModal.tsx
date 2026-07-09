import { useState, useEffect } from 'react';

interface EditAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (assignmentId: string, data: { monthlyRent: number; endDate: string | null }) => void;
    assignment: any;
}

const EditAssignmentModal = ({ isOpen, onClose, onSave, assignment }: EditAssignmentModalProps) => {
    const [monthlyRent, setMonthlyRent] = useState<number>(0);
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        if (assignment) {
            setMonthlyRent(assignment.monthlyRent || 0);
            setEndDate(assignment.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : '');
        }
    }, [assignment]);

    if (!isOpen || !assignment) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(assignment.id, {
            monthlyRent,
            endDate: endDate || null
        });
    };

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Edit Assignment</h3>
                                    <p className="text-sm text-gray-600 mt-1">Update unit assignment details</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Unit</label>
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                        value={`${assignment.unitNumber} - ${assignment.propertyName}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Monthly Rent</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        max="99999.99"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        value={monthlyRent}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const num = parseFloat(val);
                                            if (!isNaN(num) && num <= 99999.99 && /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                                                setMonthlyRent(num);
                                            } else if (val === '') {
                                                setMonthlyRent(0);
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                            >
                                Update Assignment
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 sm:mt-0 w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
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

export default EditAssignmentModal;
