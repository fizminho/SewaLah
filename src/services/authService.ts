import { auth, db } from '../lib/client';

export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; fullName: string; phone?: string; }

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

async function fetchProfile(userId: string): Promise<AuthUser> {
    const { data, error } = await db.from('users')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .single();
    if (error) throw new Error(error.message);
    return { id: data.id, email: data.email, fullName: data.full_name, role: data.role };
}

export const authService = {
    async login(dto: LoginDto): Promise<AuthUser> {
        const { data, error } = await auth.signIn(dto.email, dto.password);
        if (error) throw new Error(error.message);
        return fetchProfile(data.user.id);
    },

    async register(dto: RegisterDto): Promise<AuthUser> {
        const { data, error } = await auth.signUp(dto.email, dto.password, {
            full_name: dto.fullName,
            phone: dto.phone,
        });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Registration failed');

        const { error: insertError } = await db.from('users').insert({
            id: data.user.id,
            email: dto.email,
            full_name: dto.fullName,
            phone: dto.phone ?? null,
            role: 'Owner',
        });
        if (insertError) throw new Error(insertError.message);

        return { id: data.user.id, email: dto.email, fullName: dto.fullName, role: 'Owner' };
    },

    logout: () => auth.signOut(),

    async getProfile(): Promise<AuthUser> {
        const { data: { user }, error } = await auth.getUser();
        if (error || !user) throw new Error('Not authenticated');
        return fetchProfile(user.id);
    },
};
