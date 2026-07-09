import React, { useState, useEffect } from 'react';
import { AuthContext, User } from './AuthContextDefinition';
import { auth, db } from '../lib/client';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = async (uid: string) => {
        const { data } = await db.from('users')
            .select('id, email, full_name, role').eq('id', uid).single();
        if (data) setUser({ id: data.id, email: data.email, fullName: data.full_name, role: data.role });
    };

    useEffect(() => {
        auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUser(session.user.id).finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) loadUser(session.user.id);
            else setUser(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
