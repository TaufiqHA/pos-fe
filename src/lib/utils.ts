export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '-';

  const dateObj = new Date(dateString);

  if (isNaN(dateObj.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

export function generateInvoiceNumber(seq: number) {
  return `INV-${String(seq).padStart(3, '0')}`;
}

export const formatRibuan = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const numberString = value.toString().replace(/[^0-9]/g, "");
  if (!numberString) return "";
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const unformatRibuan = (value: string | number | null | undefined): number => {
  if (!value) return 0;
  return parseInt(value.toString().replace(/\./g, ""), 10) || 0;
};

