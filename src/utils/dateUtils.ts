export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('en-MY', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const toISOString = (date: string | Date): string => {
  return new Date(date).toISOString();
};

export const isOverdue = (dueDate: string | Date): boolean => {
  return new Date(dueDate) < new Date();
};

export const getDaysUntil = (date: string | Date): number => {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
