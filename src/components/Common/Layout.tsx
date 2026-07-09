import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isOwner = location.pathname.startsWith('/owner');
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-primary-600">
                                    {isOwner ? 'RRSaaS Owner' : 'RRSaaS Renter'}
                                </span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {isOwner ? (
                                    <>
                                        <Link to="/owner" className={`${location.pathname === '/owner' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Dashboard
                                        </Link>
                                        <Link to="/owner/properties" className={`${location.pathname === '/owner/properties' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Properties
                                        </Link>
                                        <Link to="/owner/renters" className={`${location.pathname === '/owner/renters' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Renters
                                        </Link>
                                        <Link to="/owner/invoices" className={`${location.pathname === '/owner/invoices' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Invoices
                                        </Link>
                                        <Link to="/owner/payments" className={`${location.pathname === '/owner/payments' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Payments
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/renter" className={`${location.pathname === '/renter' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Dashboard
                                        </Link>
                                        <Link to="/renter/invoices" className={`${location.pathname === '/renter/invoices' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                                            Invoices
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                            <span className="text-sm text-gray-700">{user?.fullName || user?.email}</span>
                            <button 
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
