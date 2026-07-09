import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          i18n.language === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('ms')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          i18n.language === 'ms'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        BM
      </button>
    </div>
  );
};

export default LanguageSwitcher;
