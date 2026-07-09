import Select, { StylesConfig } from 'react-select';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const CustomSelect = ({ options, value, onChange, placeholder = 'Select...' }: CustomSelectProps) => {
    const selectedOption = options.find(opt => opt.value === value) || null;

    const customStyles: StylesConfig<Option, false> = {
        control: (base, state) => ({
            ...base,
            minHeight: '42px',
            borderRadius: '0.75rem',
            borderWidth: '1px',
            borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
            '&:hover': {
                borderColor: '#3B82F6',
            },
            backgroundColor: 'white',
            cursor: 'pointer',
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '2px 16px',
        }),
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        dropdownIndicator: (base, state) => ({
            ...base,
            color: '#6B7280',
            padding: '8px',
            transition: 'all 0.2s',
            transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            '&:hover': {
                color: '#3B82F6',
            },
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            marginTop: '4px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
        }),
        menuList: (base) => ({
            ...base,
            padding: '4px',
        }),
        option: (base, state) => ({
            ...base,
            borderRadius: '0.5rem',
            padding: '10px 12px',
            margin: '2px 0',
            cursor: 'pointer',
            backgroundColor: state.isSelected 
                ? '#3B82F6' 
                : state.isFocused 
                ? '#EFF6FF' 
                : 'white',
            color: state.isSelected ? 'white' : '#374151',
            fontWeight: state.isSelected ? '600' : '500',
            fontSize: '14px',
            transition: 'all 0.15s',
            '&:active': {
                backgroundColor: '#3B82F6',
            },
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9CA3AF',
            fontSize: '14px',
        }),
        singleValue: (base) => ({
            ...base,
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
        }),
    };

    return (
        <Select
            options={options}
            value={selectedOption}
            onChange={(option) => onChange(option?.value || '')}
            styles={customStyles}
            placeholder={placeholder}
            isSearchable={false}
        />
    );
};

export default CustomSelect;
