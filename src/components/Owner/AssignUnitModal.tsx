import { useState, useEffect } from 'react';
import { propertyService } from '../../services/propertyService';
import { unitService } from '../../services/unitService';
import CustomSelect from '../Common/CustomSelect';

interface AssignUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (renterId: string, data: any) => void;
    renter: any;
}

const AssignUnitModal = ({ isOpen, onClose, onSave, renter }: AssignUnitModalProps) => {
    const [propertyId, setPropertyId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [monthlyRent, setMonthlyRent] = useState('');

    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchProperties();
        }
    }, [isOpen]);

    useEffect(() => {
        if (propertyId) {
            fetchUnits(propertyId);
        } else {
            setUnits([]);
            setUnitId('');
        }
    }, [propertyId]);

    const fetchProperties = async () => {
        try {
            const result = await propertyService.getAll();
            setProperties(result.items || []);
        } catch (err) {
            console.error('Failed to fetch properties', err);
        }
    };

    const fetchUnits = async (pid: string) => {
        try {
            const unitsData = await unitService.getByProperty(pid);
            const selectedProperty = properties.find(p => p.id === pid);
            const isWhole = selectedProperty?.rentalMode === 'WholeProperty';
            setUnits(unitsData);
            if (isWhole && unitsData.length > 0) {
                setUnitId(unitsData[0].id);
                setMonthlyRent((unitsData[0].base_rent ?? 0).toString());
            } else {
                setUnitId('');
                setMonthlyRent('');
            }
        } catch (err) {
            console.error('Failed to fetch units', err);
        }
    };

    const handleUnitChange = (id: string) => {
        setUnitId(id);
        const u = units.find(u => u.id === id);
        if (u) setMonthlyRent((u.base_rent ?? 0).toString());
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProperty = properties.find(p => p.id === propertyId);
        const resolvedUnitId = selectedProperty?.rentalMode === 'WholeProperty' && units.length > 0
            ? units[0].id
            : unitId;
        if (!resolvedUnitId) { alert('Please select a unit'); return; }
        onSave(renter.id, {
            unitId: resolvedUnitId,
            startDate,
            monthlyRent: parseFloat(monthlyRent)
        });
        setPropertyId('');
        setUnitId('');
        setMonthlyRent('');
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
                                        Assign New Unit
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Assign unit to {renter?.fullName}</p>
                                </div>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="w-full">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="property" className="block text-xs font-semibold text-gray-700 mb-2">Property</label>
                                                <CustomSelect
                                                    options={[
                                                        { value: '', label: 'Select Property' },
                                                        ...properties.map(p => ({
                                                            value: p.id,
                                                            label: `${p.name}${!p.isActive ? ' (Deactivated)' : ''}`
                                                        }))
                                                    ]}
                                                    value={propertyId}
                                                    onChange={setPropertyId}
                                                    placeholder="Select property"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="unit" className="block text-xs font-semibold text-gray-700 mb-2">Unit</label>
                                                {(() => {
                                                    const selectedProperty = properties.find(p => p.id === propertyId);
                                                    const isWhole = selectedProperty?.rentalMode === 'WholeProperty';
                                                    if (isWhole) {
                                                        const u = units[0];
                                                        return <input readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700" value={u ? (u.unit_number ?? '-') : 'No unit found'} />;
                                                    }
                                                    return (
                                                        <CustomSelect
                                                            options={[
                                                                { value: '', label: propertyId ? 'Select Unit' : 'Select a property first' },
                                                                ...units.map(u => {
                                                                    const isUnitInactive = !u.is_active;
                                                                    const isOccupied = u.renter_unit_assignments?.length > 0;
                                                                    let label = u.unit_number ?? u.unitNumber;
                                                                    if (isUnitInactive) label += ' (Deactivated)';
                                                                    else if (isOccupied) label += ' (Occupied)';
                                                                    return { value: u.id, label };
                                                                })
                                                            ]}
                                                            value={unitId}
                                                            onChange={handleUnitChange}
                                                            placeholder="Select unit"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="startDate" className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="monthlyRent" className="block text-xs font-semibold text-gray-700 mb-2">Monthly Rent</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                                    value={monthlyRent}
                                                    onChange={(e) => setMonthlyRent(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transition-all"
                            >
                                Assign Unit
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

export default AssignUnitModal;
