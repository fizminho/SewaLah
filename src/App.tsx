import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import './i18n';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EnhancedOwnerDashboard from './pages/EnhancedOwnerDashboard';
import EnhancedPropertiesPage from './pages/EnhancedPropertiesPage';
import EnhancedPropertyDetailsPage from './pages/EnhancedPropertyDetailsPage';
import EnhancedRentersPage from './pages/EnhancedRentersPage';
import EnhancedRenterDetailsPage from './pages/EnhancedRenterDetailsPage';
import EnhancedInvoicesPage from './pages/EnhancedInvoicesPage';
import EnhancedPaymentsPage from './pages/EnhancedPaymentsPage';
import RenterDashboard from './pages/RenterDashboard';
import RenterInvoices from './pages/RenterInvoices';
import NotFoundPage from './pages/NotFoundPage';
import EnhancedLayout from './components/Common/EnhancedLayout';

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<EnhancedLayout />}>
                        <Route path="/owner" element={<EnhancedOwnerDashboard />} />
                        <Route path="/owner/properties" element={<EnhancedPropertiesPage />} />
                        <Route path="/owner/properties/:id" element={<EnhancedPropertyDetailsPage />} />
                        <Route path="/owner/renters" element={<EnhancedRentersPage />} />
                        <Route path="/owner/renters/:id" element={<EnhancedRenterDetailsPage />} />
                        <Route path="/owner/invoices" element={<EnhancedInvoicesPage />} />
                        <Route path="/owner/payments" element={<EnhancedPaymentsPage />} />
                        <Route path="/renter" element={<RenterDashboard />} />
                        <Route path="/renter/invoices" element={<RenterInvoices />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </Suspense>
    );
}

export default App;
