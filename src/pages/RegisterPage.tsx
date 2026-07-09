import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/client';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setIsLoading(true);
        try {
            const { data, error: signUpError } = await auth.signUp(email, password, { full_name: fullName });
            if (signUpError) throw signUpError;
            if (!data.user) throw new Error('Registration failed');
            const { error: insertError } = await db.from('users').insert({
                id: data.user.id, email, full_name: fullName, role: 'Owner',
            });
            if (insertError) throw insertError;
            navigate('/owner');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0078d4] to-[#004a8e] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">S</div>
                </div>
                <h2 className="text-center text-3xl font-bold text-[#111827]">Create your account</h2>
                <p className="mt-3 text-center text-sm text-[#6b7280]">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-[#0078d4] hover:text-[#0063b1] transition-colors">Sign in</Link>
                </p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-lg rounded-xl sm:px-10 border border-[#e5e7eb]">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-[#d13438] text-[#d13438] px-4 py-3 rounded-lg" role="alert">
                                <span className="block sm:inline font-medium">{error}</span>
                            </div>
                        )}
                        {[
                            { id: 'fullName', label: 'Full Name', type: 'text', value: fullName, onChange: setFullName, autoComplete: 'name' },
                            { id: 'email', label: 'Email address', type: 'email', value: email, onChange: setEmail, autoComplete: 'email' },
                            { id: 'password', label: 'Password', type: 'password', value: password, onChange: setPassword, autoComplete: 'new-password' },
                            { id: 'confirmPassword', label: 'Confirm Password', type: 'password', value: confirmPassword, onChange: setConfirmPassword, autoComplete: 'new-password' },
                        ].map(f => (
                            <div key={f.id}>
                                <label htmlFor={f.id} className="block text-sm font-semibold text-[#374151] mb-2">{f.label}</label>
                                <input
                                    id={f.id} type={f.type} autoComplete={f.autoComplete} required
                                    value={f.value} onChange={(e) => f.onChange(e.target.value)}
                                    className="block w-full px-4 py-3 border border-[#d1d5db] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        ))}
                        <button
                            type="submit" disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-[#0078d4] to-[#0063b1] hover:from-[#0063b1] hover:to-[#004a8e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078d4] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
