import { useState, useEffect } from 'react';
import { RentalMode } from '../../types';
import CustomSelect from '../Common/CustomSelect';

interface UnitInput {
    id?: string;
    unitNumber: string;
    baseRent: number;
    description: string;
}

interface EditPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, property: any) => void;
    property: any;
}

const EditPropertyModal = ({ isOpen, onClose, onSave, property }: EditPropertyModalProps) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [rentalMode, setRentalMode] = useState<RentalMode>(RentalMode.WholeProperty);
    const [baseRent, setBaseRent] = useState<number>(0);
    const [units, setUnits] = useState<UnitInput[]>([]);
    const [originalUnitIds, setOriginalUnitIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (property) {
            setName(property.name || '');
            setAddress(property.address || '');
            setDescription(property.description || '');
            setIsActive(property.isActive ?? true);
            setRentalMode(property.rentalMode || RentalMode.WholeProperty);

            const propertyUnits = property.units?.filter((u: any) => u.isActive).map((u: any) => ({
                id: u.id,
                unitNumber: u.unitNumber,
                baseRent: u.baseRent,
                description: u.description || ''
            })) || [];

            setUnits(propertyUnits);
            setOriginalUnitIds(new Set(propertyUnits.filter((u: UnitInput) => u.id).map((u: UnitInput) => u.id!)));

            if (property.rentalMode === RentalMode.WholeProperty && propertyUnits.length > 0) {
                setBaseRent(propertyUnits[0].baseRent);
            }
        }
    }, [property]);

    if (!isOpen) return null;

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
        }
        
        newUnits[index] = { ...newUnits[index], [field]: value };
        setUnits(newUnits);
    };

    const handleModeChange = (newMode: RentalMode) => {
        if (newMode !== rentalMode) {
            setRentalMode(newMode);
            // If switching mode, we'll let the backend deactivate old units
            // and we start fresh in the UI for the new mode
            if (newMode === RentalMode.WholeProperty) {
                setUnits([]);
                setBaseRent(0);
            } else {
                setUnits([{ unitNumber: '', baseRent: 0, description: '' }]);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalUnits = units;
        if (rentalMode === RentalMode.WholeProperty) {
            const existingWholeUnit = units.find(u => u.unitNumber === 'Whole Property' || u.id);
            finalUnits = [{
                id: existingWholeUnit?.id,
                unitNumber: 'Whole Property',
                baseRent: baseRent,
                description: 'Default unit for whole property'
            }];
        } else {
            finalUnits = units.filter(u => u.unitNumber.trim() !== '');
        }

        onSave(property.id, {
            name,
            address,
            description,
            isActive,
            rentalMode,
            units: finalUnits
        });
        onClose();
    };

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
                                        Edit Property
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Update property information and units</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-2">Property Name</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="rentalMode" className="block text-xs font-semibold text-gray-700 mb-2">Rental Mode</label>
                                            <CustomSelect
                                                options={[
                                                    { value: RentalMode.WholeProperty, label: 'Whole Property' },
                                                    { value: RentalMode.ByRoom, label: 'By Room' },
                                                ]}
                                                value={rentalMode}
                                                onChange={(value) => handleModeChange(value as RentalMode)}
                                                placeholder="Select mode"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={200}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
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
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
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
                                        <div className="md:col-span-2">
                                            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-2">Description</label>
                                            <textarea
                                                rows={3}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex items-center p-4 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-600 border-gray-300 rounded"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                                disabled
                                            />
                                            <label className="ml-3 block text-sm text-gray-600">
                                                Active Status (use Activate/Deactivate button)
                                            </label>
                                        </div>
                                    </div>

                                    {rentalMode === RentalMode.ByRoom && (
                                        <div className="border-t border-gray-200 pt-6 mt-6">
                                            <div className="flex justify-between items-center mb-5">
                                                <h4 className="text-lg font-semibold text-gray-900">Units / Rooms</h4>
                                                <button
                                                    type="button"
                                                    onClick={handleAddUnit}
                                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    + Add Unit
                                                </button>
                                            </div>
                                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                                {units.map((unit, index) => (
                                                    <div key={index} className="flex gap-3 items-start p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 relative hover:shadow-md transition-shadow">
                                                        <div className="flex-1">
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
                                                        </div>
                                                        <div className="flex-1">
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
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveUnit(index)}
                                                            disabled={!!(unit.id && originalUnitIds.has(unit.id))}
                                                            className={`mt-7 p-2 rounded-lg transition-colors ${
                                                                unit.id && originalUnitIds.has(unit.id)
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                                            }`}
                                                            title={unit.id && originalUnitIds.has(unit.id) ? 'Cannot remove original unit' : 'Remove unit'}
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all"
                            >
                                Update Property
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

export default EditPropertyModal;
