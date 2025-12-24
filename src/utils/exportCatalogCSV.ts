import { CatalogFurnitureItem } from '@/services/catalogService';

export function exportCatalogToCSV(items: CatalogFurnitureItem[], filename?: string): void {
  const headers = ['ID', 'Name', 'Category', 'Description', 'Price', 'Image URL', 'Brand', 'Source'];
  
  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.join(','),
    ...items.map(item => [
      escapeCSV(item.id),
      escapeCSV(item.name),
      escapeCSV(item.category),
      escapeCSV(item.description),
      escapeCSV(item.price),
      escapeCSV(item.imageUrl),
      escapeCSV(item.brand),
      escapeCSV(item.isVendorProduct ? 'vendor' : 'catalog')
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const downloadFilename = filename || `product-catalog-${date}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
