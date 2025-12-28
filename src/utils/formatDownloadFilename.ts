/**
 * Formats a consistent download filename with agentb_ prefix
 * @param type - The type of content being downloaded
 * @param itemName - The name of the item (project, product, etc.)
 * @param extension - File extension (default: png)
 * @param suffix - Optional additional suffix
 * @returns Formatted filename like "agentb_render_livingroom.png"
 */
export function formatDownloadFilename(
  type: 'render' | 'upscaled' | 'multicam' | 'customlibrary' | 'photostudio' | 'technicaldrawing' | 'bom' | 'drawingplan' | 'layout' | 'ppt',
  itemName: string,
  extension: 'png' | 'svg' | 'csv' | 'pdf' | 'pptx' | 'json' = 'png',
  suffix?: string
): string {
  // Slugify the name: lowercase, remove special chars, limit length
  const slugifiedName = itemName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40) || 'item';
  
  const parts = ['agentb', type, slugifiedName];
  if (suffix) {
    const slugifiedSuffix = suffix
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20);
    if (slugifiedSuffix) parts.push(slugifiedSuffix);
  }
  
  return `${parts.join('_')}.${extension}`;
}

/**
 * Helper to slugify a string for filenames
 */
export function slugify(text: string, maxLength: number = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, maxLength) || 'item';
}
