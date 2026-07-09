import { db } from '../lib/client';

export interface CreateUnitDto {
    unitNumber: string;
    baseRent: number;
    description?: string;
}

export const unitService = {
    async create(propertyId: string, data: CreateUnitDto) {
        const { data: row, error } = await db.from('units').insert({
            property_id: propertyId,
            unit_number: data.unitNumber,
            base_rent: data.baseRent,
            description: data.description ?? null,
            is_active: true,
        }).select().single();
        if (error) throw new Error(error.message);
        return row;
    },

    async getByProperty(propertyId: string) {
        const { data, error } = await db.from('units')
            .select('*, renter_unit_assignments(*, renters(*))')
            .eq('property_id', propertyId)
            .eq('is_deleted', false);
        if (error) throw new Error(error.message);
        return data ?? [];
    },
};
