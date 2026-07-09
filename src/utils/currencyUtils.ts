export const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
};
