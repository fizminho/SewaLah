import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/client';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) navigate(user.role === 'Renter' ? '/renter' : '/owner');
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data, error: authError } = await auth.signIn(email, password);
            if (authError) throw authError;
            const { data: profile } = await db.from('users').select('role').eq('id', data.user.id).single();
            navigate(profile?.role === 'Renter' ? '/renter' : '/owner');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6 lg:space-y-8 bg-white p-6 lg:p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-4 lg:mt-6 text-center text-2xl lg:text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-xs lg:text-sm text-gray-600">
                        Or{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-6 lg:mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline text-sm">{error}</span>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address" name="email" type="email" autoComplete="email" required
                                className="appearance-none rounded-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                                placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password" name="password" type="password" autoComplete="current-password" required
                                className="appearance-none rounded-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit" disabled={isLoading}
                            className="group relative w-full flex justify-center py-2.5 lg:py-3 px-4 border border-transparent text-sm lg:text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
