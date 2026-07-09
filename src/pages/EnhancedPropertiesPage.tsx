import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CreatePropertyModal from '../components/Owner/CreatePropertyModal';
import EditPropertyModal from '../components/Owner/EditPropertyModal';
import { Card, Button, Input, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import CustomSelect from '../components/Common/CustomSelect';
import Pagination from '../components/Common/Pagination';
import { propertyService } from '../services/propertyService';
import { PropertyModel } from '../types';

const EnhancedPropertiesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [properties, setProperties] = useState<any[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PropertyModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProperty] = useState<PropertyModel | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchProperties = async () => {
        setIsLoading(true);
        try {
            const result = await propertyService.getAll();
            setProperties(result.items || []);
        } catch (err: any) {
            setError(t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        let filtered = properties;
        
        if (statusFilter) {
            filtered = filtered.filter(p => 
                statusFilter === 'Active' ? p.isActive : !p.isActive
            );
        }
        
        if (searchQuery) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredProperties(filtered);
        setCurrentPage(1);
    }, [properties, statusFilter, searchQuery]);

    const paginatedProperties = filteredProperties.slice(
        Math.max(0, (currentPage - 1) * itemsPerPage),
        Math.min(filteredProperties.length, currentPage * itemsPerPage)
    );

    const handleAddProperty = async (newProperty: any) => {
        try {
            await propertyService.create(newProperty);
            fetchProperties();
            setIsCreateModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to add property');
        }
    };

    const handleEditProperty = async (id: string, updatedData: any) => {
        try {
            await propertyService.update(id, updatedData);
            fetchProperties();
            setIsEditModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update property');
        }
    };

    const handleDeleteProperty = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
            try {
                await propertyService.update(id, { name, address: '', isActive: false });
                fetchProperties();
            } catch (err: any) {
                alert(err.message || 'Failed to deactivate property');
            }
        }
    };

    const handleActivateProperty = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to activate "${name}"?`)) {
            try {
                await propertyService.update(id, { name, address: '', isActive: true });
                fetchProperties();
            } catch (err: any) {
                alert(err.message || 'Failed to activate property');
            }
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
            {error && <Alert variant="error" title="Error">{error}</Alert>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('properties')}</h1>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{t('manageRentalProperties')}</p>
                </div>
                <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                    ➕ {t('addProperty')}
                </Button>
            </div>

            <CreatePropertyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleAddProperty}
            />

            <EditPropertyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditProperty}
                property={editingProperty}
            />

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('status')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allStatuses') },
                                { value: 'Active', label: t('active') },
                                { value: 'Inactive', label: t('inactive') },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder={t('selectStatus')}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="text-xs font-medium text-gray-600 mb-2 block">{t('search')}</label>
                        <Input 
                            placeholder={t('searchProperties')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon="🔍"
                        />
                    </div>
                </div>
            </Card>

            {/* Properties Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{t('propertyName')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap hidden md:table-cell">{t('address')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{t('units')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap hidden sm:table-cell">{t('activeRenters')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap hidden lg:table-cell">{t('rentalMode')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{t('status')}</th>
                                    <th className="px-3 lg:px-4 py-2 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProperties.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 lg:px-4 py-8 text-center text-gray-500 text-sm">
                                            {properties.length === 0 ? t('noPropertiesFound') : t('noPropertiesMatch')}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProperties.map((property) => (
                                        <tr 
                                            key={property.id} 
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/owner/properties/${property.id}`)}
                                        >
                                            <td className="px-3 lg:px-4 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                {property.name}
                                            </td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm text-gray-600 hidden md:table-cell max-w-xs truncate">{property.address}</td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm text-gray-900">{property.unitCount}</td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm text-gray-900 hidden sm:table-cell">{property.activeRenterCount}</td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm text-gray-600 hidden lg:table-cell">{property.rentalMode}</td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm">
                                                <Badge variant={property.isActive ? 'success' : 'warning'}>
                                                    {property.isActive ? t('active') : t('inactive')}
                                                </Badge>
                                            </td>
                                            <td className="px-3 lg:px-4 py-2.5 text-sm">
                                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {property.isActive ? (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleDeleteProperty(property.id, property.name)}
                                                        >
                                                            {t('deactivate')}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleActivateProperty(property.id, property.name)}
                                                        >
                                                            {t('activate')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {filteredProperties.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredProperties.length}
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

export default EnhancedPropertiesPage;
