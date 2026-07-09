import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CreateRenterModal from '../components/Owner/CreateRenterModal';
import EditRenterModal from '../components/Owner/EditRenterModal';
import AssignUnitModal from '../components/Owner/AssignUnitModal';
import { Card, Button, Input, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import CustomSelect from '../components/Common/CustomSelect';
import Pagination from '../components/Common/Pagination';
import { renterService } from '../services/renterService';

const EnhancedRentersPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [renters, setRenters] = useState<any[]>([]);
    const [filteredRenters, setFilteredRenters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedRenter, setSelectedRenter] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchRenters = async () => {
        setIsLoading(true);
        try {
            const result = await renterService.getAll();
            setRenters(result.items || []);
        } catch (err: any) {
            setError(t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRenters();
    }, []);

    useEffect(() => {
        let filtered = renters;
        
        if (statusFilter) {
            if (statusFilter === 'Active') {
                filtered = filtered.filter(r => r.isActive);
            } else if (statusFilter === 'Inactive') {
                filtered = filtered.filter(r => !r.isActive);
            } else if (statusFilter === 'Late Payment') {
                filtered = filtered.filter(r => 
                    r.activeAssignments?.some((a: any) => a.paymentStatus === 'Overdue')
                );
            }
        }
        
        if (searchQuery) {
            filtered = filtered.filter(r => 
                r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredRenters(filtered);
        setCurrentPage(1);
    }, [renters, statusFilter, searchQuery]);

    const paginatedRenters = filteredRenters.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleAddRenter = async (data: any) => {
        try {
            const renter = await renterService.create({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                idNumber: data.idNumber,
            });
            await renterService.assignUnit(renter.id, {
                unitId: data.unitId,
                startDate: data.startDate,
                endDate: data.endDate,
                monthlyRent: data.monthlyRent,
            });
            alert('Renter created and assigned successfully!');
            fetchRenters();
            setIsModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to add and assign renter');
        }
    };

    const handleUpdateRenter = async (id: string, data: any) => {
        try {
            await renterService.update(id, {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                idNumber: data.idNumber,
            });
            alert('Renter updated successfully!');
            fetchRenters();
            setIsEditModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update renter');
        }
    };

    const handleAssignUnit = async (renterId: string, data: any) => {
        try {
            await renterService.assignUnit(renterId, data);
            alert('Unit assigned successfully!');
            fetchRenters();
            setIsAssignModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to assign unit');
        }
    };

    const handleDeactivateRenter = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this renter?')) return;
        try {
            await renterService.delete(id);
            alert('Renter deactivated successfully!');
            fetchRenters();
        } catch (err: any) {
            alert(err.message || 'Failed to deactivate renter');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6">
            {error && <Alert variant="error" title={t('error')}>{error}</Alert>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('renters')}</h1>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{t('manageTenantsAssignments')}</p>
                </div>
                <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                    👤 {t('addRenter')}
                </Button>
            </div>

            <CreateRenterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddRenter}
            />

            <EditRenterModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateRenter}
                renter={selectedRenter}
            />

            <AssignUnitModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSave={handleAssignUnit}
                renter={selectedRenter}
            />

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('status')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allStatuses') },
                                { value: 'Active', label: t('active') },
                                { value: 'Late Payment', label: t('latePayment') },
                                { value: 'Inactive', label: t('inactive') },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder={t('selectStatus')}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-600 mb-2 block">{t('search')}</label>
                        <Input 
                            placeholder={t('searchRenters')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon="🔍"
                        />
                    </div>
                </div>
            </Card>

            {/* Renters Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('name')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('email')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('phone')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('tempPassword')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('assignedUnits')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('paymentStatus')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('status')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRenters.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        {renters.length === 0 ? t('noRentersFound') : t('noRentersMatch')}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRenters.map((renter) => (
                                    <tr 
                                        key={renter.id} 
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/owner/renters/${renter.id}`)}
                                    >
                                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{renter.fullName}</td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">{renter.email}</td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">{renter.phone}</td>
                                        <td className="px-4 py-2.5 text-sm">
                                            {renter.passwordChangeRequired && renter.temporaryPassword ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
                                                        {renter.temporaryPassword}
                                                    </code>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(renter.temporaryPassword);
                                                            alert('Password copied!');
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                        title="Copy password"
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">
                                            {renter.activeAssignments?.map((a: any) => (
                                                <div key={a.id} className="text-xs">
                                                    {a.unitNumber} - {a.propertyName}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                {renter.activeAssignments?.map((a: any) => (
                                                    <Badge key={a.id} variant={
                                                        a.paymentStatus === 'Paid' ? 'success' :
                                                        a.paymentStatus === 'Overdue' ? 'error' :
                                                        a.paymentStatus === 'Pending' ? 'warning' : 'info'
                                                    }>
                                                        {a.paymentStatus === 'Paid' ? t('paid') : a.paymentStatus === 'Overdue' ? t('overdue') : a.paymentStatus === 'Pending' ? t('pending') : a.paymentStatus}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-sm">
                                            <Badge variant={renter.isActive ? 'success' : 'warning'}>
                                                {renter.isActive ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2.5 text-sm">
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="tertiary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedRenter(renter);
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                >
                                                    {t('assign')}
                                                </Button>
                                                <Button
                                                    variant="tertiary"
                                                    size="sm"
                                                    onClick={() => handleDeactivateRenter(renter.id)}
                                                >
                                                    {t('deactivate')}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredRenters.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredRenters.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </Card>
        </div>
    );
};

export default EnhancedRentersPage;
