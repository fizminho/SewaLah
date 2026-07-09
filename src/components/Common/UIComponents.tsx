import React from 'react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center gap-2 justify-center touch-manipulation';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl font-semibold',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    tertiary: 'text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-600 text-white hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs lg:text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm lg:text-base min-h-[40px]',
    lg: 'px-5 py-2.5 text-base lg:text-lg min-h-[44px]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="animate-spin">⟳</span> : icon}
      {children}
    </button>
  );
};

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ elevated = false, className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 ${
        elevated ? 'shadow-lg' : 'shadow-sm'
      } p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</div>}
        <input
          className={`w-full px-4 py-2 ${icon ? 'pl-10' : ''} border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
            error ? 'border-red-600' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
        {footer && <div className="p-4 lg:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
};

// Table Component
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
}

export const Table: React.FC<TableProps> = ({ striped = true, className = '', ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-collapse ${striped ? 'bg-white' : ''} ${className}`}
        {...props}
      />
    </div>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <th
    className={`px-6 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-200 ${className}`}
    {...props}
  />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', ...props }) => (
  <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${className}`} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <td className={`px-6 py-4 text-sm text-gray-900 ${className}`} {...props} />
);

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => {
  return (
    <Card className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2 truncate">{label}</p>
        <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 break-words">{value}</p>
        {trend && (
          <p className={`text-xs lg:text-sm mt-1 lg:mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
      {icon && <div className="text-2xl lg:text-3xl opacity-20 shrink-0">{icon}</div>}
    </Card>
  );
};

// Loading Spinner
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
  );
};

// Alert Component
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, className = '', ...props }) => {
  const variants = {
    success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800',
    error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800',
  };

  return (
    <div className={`p-4 rounded ${variants[variant]} ${className}`} {...props}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      {children}
    </div>
  );
};
