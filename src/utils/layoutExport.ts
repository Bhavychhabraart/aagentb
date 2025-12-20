import { RoomDimensions } from '@/types/layout-creator';

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSON(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

export function formatDimension(value: number, unit: string): string {
  if (unit === 'ft') {
    const feet = Math.floor(value);
    const inches = Math.round((value - feet) * 12);
    return inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;
  }
  if (unit === 'm') {
    return `${value.toFixed(2)}m`;
  }
  if (unit === 'cm') {
    return `${value}cm`;
  }
  return `${value}"`;
}

export function getRoomLabel(dimensions: RoomDimensions): string {
  return `${dimensions.width}${dimensions.unit === 'ft' ? "'" : dimensions.unit} × ${dimensions.depth}${dimensions.unit === 'ft' ? "'" : dimensions.unit}`;
}

export function formatDimensions(dimensions: RoomDimensions): string {
  return getRoomLabel(dimensions);
}

export function downloadJson(data: object, filename: string) {
  downloadJSON(data, filename);
}

export function pixelsToUnit(pixels: number, unit: string, pixelsPerInch: number): number {
  const inches = pixels / pixelsPerInch;
  switch (unit) {
    case 'ft':
      return inches / 12;
    case 'm':
      return inches * 0.0254;
    case 'cm':
      return inches * 2.54;
    default:
      return inches;
  }
}

export function unitToPixels(value: number, unit: string, pixelsPerInch: number): number {
  let inches: number;
  switch (unit) {
    case 'ft':
      inches = value * 12;
      break;
    case 'm':
      inches = value * 39.37;
      break;
    case 'cm':
      inches = value * 0.3937;
      break;
    default:
      inches = value;
  }
  return inches * pixelsPerInch;
}
