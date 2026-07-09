import { useState } from 'react';
import { RentalMode } from '../../types';
import CustomSelect from '../Common/CustomSelect';
import { db } from '../../lib/client';

interface UnitInput {
    unitNumber: string;
    baseRent: number;
    description: string;
}

interface CreatePropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (property: any) => void;
}

const CreatePropertyModal = ({ isOpen, onClose, onSave }: CreatePropertyModalProps) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [rentalMode, setRentalMode] = useState<RentalMode>(RentalMode.WholeProperty);
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [baseRent, setBaseRent] = useState<number>(0);
    const [units, setUnits] = useState<UnitInput[]>([{ unitNumber: '', baseRent: 0, description: '' }]);
    const [nameError, setNameError] = useState('');
    const [unitErrors, setUnitErrors] = useState<{ [key: number]: string }>({});

    if (!isOpen) return null;

    const checkPropertyName = async (propertyName: string) => {
        if (!propertyName.trim()) {
            setNameError('');
            return;
        }
        // Check for duplicate name client-side via Supabase
        const { data } = await db.from('properties')
            .select('id')
            .eq('name', propertyName)
            .limit(1);
        if (data && data.length > 0) {
            setNameError('Property with this name already exists');
        } else {
            setNameError('');
        }
    };

    const handleAddUnit = () => {
        setUnits([...units, { unitNumber: '', baseRent: 0, description: '' }]);
    };

    const handleRemoveUnit = (index: number) => {
        setUnits(units.filter((_, i) => i !== index));
    };

    const handleUnitChange = (index: number, field: keyof UnitInput, value: any) => {
        const newUnits = [...units];
        
        if (field === 'baseRent') {
            const numValue = parseFloat(value);
            if (numValue > 99999.99) return;
            newUnits[index] = { ...newUnits[index], [field]: numValue };
        } else {
            newUnits[index] = { ...newUnits[index], [field]: value };
        }
        
        if (field === 'unitNumber') {
            const duplicates = newUnits.filter(u => u.unitNumber === value && u.unitNumber.trim() !== '');
            if (duplicates.length > 1) {
                setUnitErrors({ ...unitErrors, [index]: 'Unit number already exists in this property' });
            } else {
                const newErrors = { ...unitErrors };
                delete newErrors[index];
                setUnitErrors(newErrors);
            }
        }
        
        setUnits(newUnits);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (nameError) {
            alert('Please fix the property name error before submitting');
            return;
        }

        if (Object.keys(unitErrors).length > 0) {
            alert('Please fix unit number errors before submitting');
            return;
        }

        const finalUnits = rentalMode === RentalMode.WholeProperty
            ? [{ unitNumber: 'Whole Property', baseRent: baseRent, description: 'Default unit for whole property' }]
            : units.filter(u => u.unitNumber.trim() !== '');

        onSave({
            name,
            address,
            rentalMode,
            description,
            isActive,
            units: finalUnits
        });
        onClose();
        setName('');
        setAddress('');
        setRentalMode(RentalMode.WholeProperty);
        setDescription('');
        setIsActive(true);
        setBaseRent(0);
        setUnits([{ unitNumber: '', baseRent: 0, description: '' }]);
        setNameError('');
        setUnitErrors({});
    };

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 lg:p-8">
                            <div className="flex justify-between items-center mb-4 lg:mb-6">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900" id="modal-title">
                                        Add New Property
                                    </h3>
                                    <p className="text-xs lg:text-sm text-gray-600 mt-1">Create a new rental property</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-full">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                                        <div>
                                            <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-2">Property Name</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onBlur={() => checkPropertyName(name)}
                                            />
                                            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="rentalMode" className="block text-xs font-semibold text-gray-700 mb-2">Rental Mode</label>
                                            <CustomSelect
                                                options={[
                                                    { value: RentalMode.WholeProperty, label: 'Whole Property' },
                                                    { value: RentalMode.ByRoom, label: 'By Room' },
                                                ]}
                                                value={rentalMode}
                                                onChange={(value) => setRentalMode(value as RentalMode)}
                                                placeholder="Select mode"
                                            />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={200}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                        </div>
                                        {rentalMode === RentalMode.WholeProperty && (
                                            <div>
                                                <label htmlFor="baseRent" className="block text-xs font-semibold text-gray-700 mb-2">Monthly Rent (Whole Property)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    min="0"
                                                    max="99999.99"
                                                    placeholder="0.00"
                                                    className="w-full px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                    value={baseRent}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const num = parseFloat(val);
                                                        if (!isNaN(num) && num <= 99999.99 && /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                                                            setBaseRent(num);
                                                        } else if (val === '') {
                                                            setBaseRent(0);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {rentalMode === RentalMode.ByRoom && (
                                        <div className="border-t border-gray-200 pt-4 lg:pt-6 mt-4 lg:mt-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-5 gap-3">
                                                <h4 className="text-base lg:text-lg font-semibold text-gray-900">Units / Rooms</h4>
                                                <button
                                                    type="button"
                                                    onClick={handleAddUnit}
                                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    + Add Unit
                                                </button>
                                            </div>
                                            <div className="space-y-4 max-h-60 lg:max-h-80 overflow-y-auto pr-2">
                                                {units.map((unit, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start p-3 lg:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 relative hover:shadow-md transition-shadow">
                                                        <div className="flex-1 w-full">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Unit #</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                maxLength={10}
                                                                placeholder="e.g. 101"
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                                                value={unit.unitNumber}
                                                                onChange={(e) => handleUnitChange(index, 'unitNumber', e.target.value)}
                                                            />
                                                            {unitErrors[index] && <p className="text-red-500 text-xs mt-1">{unitErrors[index]}</p>}
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Base Rent</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                step="0.01"
                                                                min="0"
                                                                max="99999.99"
                                                                placeholder="0.00"
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                                                value={unit.baseRent}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const num = parseFloat(val);
                                                                    if (!isNaN(num) && num <= 99999.99 && /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                                                                        handleUnitChange(index, 'baseRent', num);
                                                                    } else if (val === '') {
                                                                        handleUnitChange(index, 'baseRent', 0);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        {units.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveUnit(index)}
                                                                className="sm:mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 sm:px-6 lg:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex justify-center items-center px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all"
                            >
                                Create Property
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

export default CreatePropertyModal;
