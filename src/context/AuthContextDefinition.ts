import { createContext } from 'react';

export interface User {
    id: string;
    email: string;
    role: 'Owner' | 'Renter' | 'Admin';
    fullName: string;
}

export interface AuthContextType {
    user: User | null;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
