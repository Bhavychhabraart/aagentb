// Comprehensive materials library for custom furniture creation

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  subcategory: string;
  description?: string;
  colorHex?: string;
  properties?: {
    waterResistant?: boolean;
    scratchResistant?: boolean;
    grade?: string;
    thickness?: string;
  };
}

export const MATERIAL_CATEGORIES = [
  'All',
  'Boards',
  'Stone',
  'Raw Stone',
  'Metal',
  'Glass',
  'Fabrics & Leathers'
] as const;

export type MaterialCategory = typeof MATERIAL_CATEGORIES[number];

// Comprehensive materials library with 100+ items
export const MATERIALS_LIBRARY: MaterialItem[] = [
  // ============ BOARDS (15+ items) ============
  // Plywood varieties
  { id: 'ply-bwp', name: 'BWP Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Boiling Water Proof, marine grade', properties: { waterResistant: true, grade: 'BWP' } },
  { id: 'ply-bwr', name: 'BWR Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Boiling Water Resistant, exterior grade', properties: { waterResistant: true, grade: 'BWR' } },
  { id: 'ply-mr', name: 'MR Grade Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Moisture Resistant, interior use', properties: { grade: 'MR' } },
  { id: 'ply-commercial', name: 'Commercial Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Standard interior grade plywood', properties: { grade: 'Commercial' } },
  { id: 'ply-film-faced', name: 'Film Faced Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Phenolic film coated, shuttering grade', properties: { waterResistant: true } },
  { id: 'ply-flexible', name: 'Flexible Plywood', category: 'Boards', subcategory: 'Plywood', description: 'Bendable plywood for curved surfaces' },
  
  // MDF varieties
  { id: 'mdf-plain', name: 'Plain MDF', category: 'Boards', subcategory: 'MDF', description: 'Medium Density Fibreboard, standard', colorHex: '#C4A77D' },
  { id: 'mdf-laminated', name: 'Laminated MDF', category: 'Boards', subcategory: 'MDF', description: 'Pre-laminated finish MDF', colorHex: '#E8DCC4' },
  { id: 'mdf-moisture', name: 'Moisture Resistant MDF', category: 'Boards', subcategory: 'MDF', description: 'Green core, moisture resistant', properties: { waterResistant: true } },
  { id: 'mdf-fire', name: 'Fire Retardant MDF', category: 'Boards', subcategory: 'MDF', description: 'Fire resistant grade MDF' },
  
  // HDF
  { id: 'hdf-standard', name: 'HDF Board', category: 'Boards', subcategory: 'HDF', description: 'High Density Fibreboard, durable', colorHex: '#B8A07A', properties: { scratchResistant: true } },
  { id: 'hdf-laminate-base', name: 'HDF Laminate Base', category: 'Boards', subcategory: 'HDF', description: 'Base for laminate flooring' },
  
  // Particle Board
  { id: 'pb-standard', name: 'Particle Board', category: 'Boards', subcategory: 'Particle Board', description: 'Standard chipboard', colorHex: '#D4C4A8' },
  { id: 'pb-prelaminated', name: 'Pre-laminated Particle Board', category: 'Boards', subcategory: 'Particle Board', description: 'Factory laminated finish' },
  { id: 'pb-moisture', name: 'Moisture Proof Particle Board', category: 'Boards', subcategory: 'Particle Board', properties: { waterResistant: true } },
  
  // Blockboard
  { id: 'bb-standard', name: 'Blockboard', category: 'Boards', subcategory: 'Blockboard', description: 'Solid core with veneer faces', colorHex: '#C9B896' },
  { id: 'bb-flush', name: 'Flush Door Blockboard', category: 'Boards', subcategory: 'Blockboard', description: 'For flush door manufacturing' },
  
  // Veneer
  { id: 'veneer-teak', name: 'Teak Veneer', category: 'Boards', subcategory: 'Veneer', description: 'Natural teak wood veneer', colorHex: '#B8860B' },
  { id: 'veneer-walnut', name: 'Walnut Veneer', category: 'Boards', subcategory: 'Veneer', description: 'Rich dark walnut veneer', colorHex: '#5C4033' },
  { id: 'veneer-oak', name: 'Oak Veneer', category: 'Boards', subcategory: 'Veneer', description: 'Classic oak wood veneer', colorHex: '#C4A35A' },
  { id: 'veneer-rosewood', name: 'Rosewood Veneer', category: 'Boards', subcategory: 'Veneer', description: 'Premium rosewood veneer', colorHex: '#65000B' },

  // ============ STONE (25+ items) ============
  // Marble
  { id: 'marble-carrara', name: 'Carrara Marble', category: 'Stone', subcategory: 'Marble', description: 'Italian white marble with gray veins', colorHex: '#F2F0EB' },
  { id: 'marble-calacatta', name: 'Calacatta Marble', category: 'Stone', subcategory: 'Marble', description: 'Premium Italian marble with gold veins', colorHex: '#F5F3EE' },
  { id: 'marble-statuario', name: 'Statuario Marble', category: 'Stone', subcategory: 'Marble', description: 'Pure white with bold gray veins', colorHex: '#FAFAFA' },
  { id: 'marble-emperador', name: 'Emperador Marble', category: 'Stone', subcategory: 'Marble', description: 'Spanish dark brown marble', colorHex: '#4A3728' },
  { id: 'marble-makrana', name: 'Makrana White Marble', category: 'Stone', subcategory: 'Marble', description: 'Indian white marble, Taj Mahal grade', colorHex: '#FAF8F5' },
  { id: 'marble-green', name: 'Green Marble', category: 'Stone', subcategory: 'Marble', description: 'Indian green marble with white veins', colorHex: '#3D5A3D' },
  { id: 'marble-nero-marquina', name: 'Nero Marquina', category: 'Stone', subcategory: 'Marble', description: 'Spanish black marble with white veins', colorHex: '#1A1A1A' },
  { id: 'marble-onyx', name: 'Onyx Marble', category: 'Stone', subcategory: 'Marble', description: 'Translucent onyx with backlight potential', colorHex: '#FFF8E7' },
  
  // Granite
  { id: 'granite-black-galaxy', name: 'Black Galaxy Granite', category: 'Stone', subcategory: 'Granite', description: 'Indian black with gold specks', colorHex: '#0D0D0D', properties: { scratchResistant: true } },
  { id: 'granite-tan-brown', name: 'Tan Brown Granite', category: 'Stone', subcategory: 'Granite', description: 'Brown with black and white spots', colorHex: '#8B4513', properties: { scratchResistant: true } },
  { id: 'granite-absolute-black', name: 'Absolute Black Granite', category: 'Stone', subcategory: 'Granite', description: 'Pure black granite, premium finish', colorHex: '#0A0A0A', properties: { scratchResistant: true } },
  { id: 'granite-kashmir-white', name: 'Kashmir White Granite', category: 'Stone', subcategory: 'Granite', description: 'White with gray and burgundy specs', colorHex: '#E8E4E0', properties: { scratchResistant: true } },
  { id: 'granite-rajasthan-black', name: 'Rajasthan Black Granite', category: 'Stone', subcategory: 'Granite', description: 'Indian premium black granite', colorHex: '#1C1C1C', properties: { scratchResistant: true } },
  { id: 'granite-steel-gray', name: 'Steel Gray Granite', category: 'Stone', subcategory: 'Granite', description: 'Dark gray with silver specks', colorHex: '#4A4A4A', properties: { scratchResistant: true } },
  
  // Quartz
  { id: 'quartz-calacatta', name: 'Calacatta Quartz', category: 'Stone', subcategory: 'Quartz', description: 'Engineered marble look quartz', colorHex: '#F8F6F3', properties: { scratchResistant: true, waterResistant: true } },
  { id: 'quartz-pure-white', name: 'Pure White Quartz', category: 'Stone', subcategory: 'Quartz', description: 'Solid white engineered stone', colorHex: '#FFFFFF', properties: { scratchResistant: true, waterResistant: true } },
  { id: 'quartz-concrete', name: 'Concrete Look Quartz', category: 'Stone', subcategory: 'Quartz', description: 'Industrial concrete appearance', colorHex: '#9B9B9B', properties: { scratchResistant: true, waterResistant: true } },
  { id: 'quartz-black', name: 'Jet Black Quartz', category: 'Stone', subcategory: 'Quartz', description: 'Solid black engineered stone', colorHex: '#0D0D0D', properties: { scratchResistant: true, waterResistant: true } },
  { id: 'quartz-statuario', name: 'Statuario Quartz', category: 'Stone', subcategory: 'Quartz', description: 'Premium marble pattern quartz', colorHex: '#FAF9F7', properties: { scratchResistant: true, waterResistant: true } },
  
  // Terrazzo
  { id: 'terrazzo-classic', name: 'Classic Terrazzo', category: 'Stone', subcategory: 'Terrazzo', description: 'Traditional chip pattern', colorHex: '#E5E0D8' },
  { id: 'terrazzo-venetian', name: 'Venetian Terrazzo', category: 'Stone', subcategory: 'Terrazzo', description: 'Larger chip, premium finish', colorHex: '#D8D0C4' },
  { id: 'terrazzo-modern', name: 'Modern Terrazzo', category: 'Stone', subcategory: 'Terrazzo', description: 'Contemporary color combinations', colorHex: '#F0E6DC' },

  // ============ RAW/NATURAL STONE (10+ items) ============
  { id: 'raw-sandstone-beige', name: 'Beige Sandstone', category: 'Raw Stone', subcategory: 'Sandstone', description: 'Natural sandstone, warm tones', colorHex: '#D4B896' },
  { id: 'raw-sandstone-red', name: 'Red Sandstone', category: 'Raw Stone', subcategory: 'Sandstone', description: 'Rajasthani red sandstone', colorHex: '#C1440E' },
  { id: 'raw-sandstone-yellow', name: 'Yellow Sandstone', category: 'Raw Stone', subcategory: 'Sandstone', description: 'Jaisalmer yellow sandstone', colorHex: '#E5C07B' },
  { id: 'raw-slate-black', name: 'Black Slate', category: 'Raw Stone', subcategory: 'Slate', description: 'Natural black slate tiles', colorHex: '#2F4F4F' },
  { id: 'raw-slate-gray', name: 'Gray Slate', category: 'Raw Stone', subcategory: 'Slate', description: 'Natural gray slate', colorHex: '#708090' },
  { id: 'raw-limestone', name: 'Limestone', category: 'Raw Stone', subcategory: 'Limestone', description: 'Natural limestone finish', colorHex: '#D3C9B8' },
  { id: 'raw-travertine', name: 'Travertine', category: 'Raw Stone', subcategory: 'Travertine', description: 'Natural travertine with pores', colorHex: '#E2D8C8' },
  { id: 'raw-basalt', name: 'Basalt Stone', category: 'Raw Stone', subcategory: 'Basalt', description: 'Dark volcanic stone', colorHex: '#1E1E1E' },
  { id: 'raw-flagstone', name: 'Flagstone', category: 'Raw Stone', subcategory: 'Flagstone', description: 'Irregular natural stone', colorHex: '#8B7355' },
  { id: 'raw-cobblestone', name: 'Cobblestone', category: 'Raw Stone', subcategory: 'Cobblestone', description: 'Rounded natural paving stone', colorHex: '#696969' },
  { id: 'raw-kota', name: 'Kota Stone', category: 'Raw Stone', subcategory: 'Limestone', description: 'Indian limestone, durable flooring', colorHex: '#5F9EA0' },

  // ============ METAL (20+ items) ============
  // Steel
  { id: 'metal-ss304', name: 'SS 304 Stainless Steel', category: 'Metal', subcategory: 'Stainless Steel', description: 'Food grade, corrosion resistant', colorHex: '#C0C0C0', properties: { waterResistant: true, grade: '304' } },
  { id: 'metal-ss316', name: 'SS 316 Stainless Steel', category: 'Metal', subcategory: 'Stainless Steel', description: 'Marine grade, superior corrosion resistance', colorHex: '#B8B8B8', properties: { waterResistant: true, grade: '316' } },
  { id: 'metal-ss-brushed', name: 'Brushed Stainless Steel', category: 'Metal', subcategory: 'Stainless Steel', description: 'Satin brushed finish', colorHex: '#A9A9A9' },
  { id: 'metal-ss-mirror', name: 'Mirror Finish Steel', category: 'Metal', subcategory: 'Stainless Steel', description: 'Highly polished mirror surface', colorHex: '#D4D4D4' },
  { id: 'metal-mild-steel', name: 'Mild Steel', category: 'Metal', subcategory: 'Steel', description: 'Low carbon steel, paintable', colorHex: '#4A4A4A' },
  { id: 'metal-ms-powder', name: 'Powder Coated MS', category: 'Metal', subcategory: 'Steel', description: 'Powder coated mild steel' },
  
  // Iron
  { id: 'metal-wrought-iron', name: 'Wrought Iron', category: 'Metal', subcategory: 'Iron', description: 'Traditional ornamental iron', colorHex: '#534B4F' },
  { id: 'metal-cast-iron', name: 'Cast Iron', category: 'Metal', subcategory: 'Iron', description: 'Heavy duty cast iron', colorHex: '#2A2A2A' },
  
  // Brass
  { id: 'metal-brass-polished', name: 'Polished Brass', category: 'Metal', subcategory: 'Brass', description: 'High shine brass finish', colorHex: '#B5A642' },
  { id: 'metal-brass-antique', name: 'Antique Brass', category: 'Metal', subcategory: 'Brass', description: 'Aged patina brass', colorHex: '#8E7618' },
  { id: 'metal-brass-brushed', name: 'Brushed Brass', category: 'Metal', subcategory: 'Brass', description: 'Satin brushed brass', colorHex: '#C9A227' },
  { id: 'metal-brass-pvd', name: 'PVD Brass', category: 'Metal', subcategory: 'Brass', description: 'PVD coated, tarnish resistant', colorHex: '#D4AF37' },
  
  // Copper
  { id: 'metal-copper-polished', name: 'Polished Copper', category: 'Metal', subcategory: 'Copper', description: 'Bright copper finish', colorHex: '#B87333' },
  { id: 'metal-copper-aged', name: 'Aged Copper', category: 'Metal', subcategory: 'Copper', description: 'Patinated verdigris copper', colorHex: '#4A766E' },
  
  // Aluminum
  { id: 'metal-aluminum-anodized', name: 'Anodized Aluminum', category: 'Metal', subcategory: 'Aluminum', description: 'Anodized finish aluminum', colorHex: '#848789' },
  { id: 'metal-aluminum-brushed', name: 'Brushed Aluminum', category: 'Metal', subcategory: 'Aluminum', description: 'Satin brushed aluminum', colorHex: '#A8A9AD' },
  
  // Other metals
  { id: 'metal-bronze', name: 'Bronze', category: 'Metal', subcategory: 'Bronze', description: 'Classic bronze finish', colorHex: '#665D1E' },
  { id: 'metal-chrome', name: 'Chrome', category: 'Metal', subcategory: 'Chrome', description: 'High polish chrome plating', colorHex: '#DBE4E8' },
  { id: 'metal-nickel', name: 'Brushed Nickel', category: 'Metal', subcategory: 'Nickel', description: 'Satin nickel finish', colorHex: '#727472' },
  { id: 'metal-gold-plated', name: 'Gold Plated', category: 'Metal', subcategory: 'Gold', description: 'Gold plated finish', colorHex: '#FFD700' },
  { id: 'metal-rose-gold', name: 'Rose Gold', category: 'Metal', subcategory: 'Gold', description: 'Rose gold PVD finish', colorHex: '#B76E79' },
  { id: 'metal-black', name: 'Matte Black Metal', category: 'Metal', subcategory: 'Coated', description: 'Powder coated matte black', colorHex: '#1A1A1A' },

  // ============ GLASS (15+ items) ============
  { id: 'glass-clear', name: 'Clear Glass', category: 'Glass', subcategory: 'Clear', description: 'Transparent clear glass', colorHex: '#E8F4F8' },
  { id: 'glass-extra-clear', name: 'Extra Clear Glass', category: 'Glass', subcategory: 'Clear', description: 'Low iron, ultra clear', colorHex: '#F5FAFA' },
  { id: 'glass-frosted', name: 'Frosted Glass', category: 'Glass', subcategory: 'Frosted', description: 'Acid etched translucent', colorHex: '#F0F0F0' },
  { id: 'glass-fluted', name: 'Fluted Glass', category: 'Glass', subcategory: 'Textured', description: 'Ribbed vertical pattern', colorHex: '#E6E6E6' },
  { id: 'glass-reeded', name: 'Reeded Glass', category: 'Glass', subcategory: 'Textured', description: 'Fine vertical ribbing', colorHex: '#EBEBEB' },
  { id: 'glass-tinted-gray', name: 'Gray Tinted Glass', category: 'Glass', subcategory: 'Tinted', description: 'Gray smoke tint', colorHex: '#4A4A4A' },
  { id: 'glass-tinted-bronze', name: 'Bronze Tinted Glass', category: 'Glass', subcategory: 'Tinted', description: 'Bronze/amber tint', colorHex: '#8B4513' },
  { id: 'glass-tinted-blue', name: 'Blue Tinted Glass', category: 'Glass', subcategory: 'Tinted', description: 'Blue tinted glass', colorHex: '#4169E1' },
  { id: 'glass-tinted-green', name: 'Green Tinted Glass', category: 'Glass', subcategory: 'Tinted', description: 'Natural green tint', colorHex: '#228B22' },
  { id: 'glass-lacquered-white', name: 'White Lacquered Glass', category: 'Glass', subcategory: 'Lacquered', description: 'Back painted white', colorHex: '#FFFFFF' },
  { id: 'glass-lacquered-black', name: 'Black Lacquered Glass', category: 'Glass', subcategory: 'Lacquered', description: 'Back painted black', colorHex: '#0D0D0D' },
  { id: 'glass-mirror', name: 'Mirror Glass', category: 'Glass', subcategory: 'Mirror', description: 'Silver coated mirror', colorHex: '#C0C0C0' },
  { id: 'glass-mirror-antique', name: 'Antique Mirror', category: 'Glass', subcategory: 'Mirror', description: 'Distressed vintage mirror', colorHex: '#A89F91' },
  { id: 'glass-stained', name: 'Stained Glass', category: 'Glass', subcategory: 'Decorative', description: 'Colored decorative glass' },
  { id: 'glass-tempered', name: 'Tempered Glass', category: 'Glass', subcategory: 'Safety', description: 'Heat strengthened safety glass', colorHex: '#E8F4F8', properties: { scratchResistant: true } },
  { id: 'glass-laminated', name: 'Laminated Glass', category: 'Glass', subcategory: 'Safety', description: 'Interlayer safety glass', colorHex: '#E5E5E5' },

  // ============ FABRICS & LEATHERS (40+ items) ============
  // Cotton varieties
  { id: 'fab-cotton-white', name: 'White Cotton', category: 'Fabrics & Leathers', subcategory: 'Cotton', description: 'Pure cotton fabric', colorHex: '#FFFFFF' },
  { id: 'fab-cotton-canvas', name: 'Cotton Canvas', category: 'Fabrics & Leathers', subcategory: 'Cotton', description: 'Heavy duty canvas', colorHex: '#F5F5DC' },
  { id: 'fab-cotton-twill', name: 'Cotton Twill', category: 'Fabrics & Leathers', subcategory: 'Cotton', description: 'Diagonal weave cotton', colorHex: '#E8E4D9' },
  
  // Linen
  { id: 'fab-linen-natural', name: 'Natural Linen', category: 'Fabrics & Leathers', subcategory: 'Linen', description: 'Undyed natural linen', colorHex: '#E8DCC8' },
  { id: 'fab-linen-white', name: 'White Linen', category: 'Fabrics & Leathers', subcategory: 'Linen', description: 'Bleached white linen', colorHex: '#FAF0E6' },
  { id: 'fab-linen-gray', name: 'Gray Linen', category: 'Fabrics & Leathers', subcategory: 'Linen', description: 'Dyed gray linen', colorHex: '#A0A0A0' },
  
  // Velvet
  { id: 'fab-velvet-emerald', name: 'Emerald Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Rich emerald green velvet', colorHex: '#50C878' },
  { id: 'fab-velvet-navy', name: 'Navy Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Deep navy blue velvet', colorHex: '#1E3A5F' },
  { id: 'fab-velvet-burgundy', name: 'Burgundy Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Rich burgundy velvet', colorHex: '#722F37' },
  { id: 'fab-velvet-mustard', name: 'Mustard Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Golden mustard velvet', colorHex: '#E1AD01' },
  { id: 'fab-velvet-blush', name: 'Blush Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Soft blush pink velvet', colorHex: '#DE5D83' },
  { id: 'fab-velvet-charcoal', name: 'Charcoal Velvet', category: 'Fabrics & Leathers', subcategory: 'Velvet', description: 'Dark charcoal velvet', colorHex: '#36454F' },
  
  // Silk
  { id: 'fab-silk-ivory', name: 'Ivory Silk', category: 'Fabrics & Leathers', subcategory: 'Silk', description: 'Luxurious ivory silk', colorHex: '#FFFFF0' },
  { id: 'fab-silk-champagne', name: 'Champagne Silk', category: 'Fabrics & Leathers', subcategory: 'Silk', description: 'Champagne colored silk', colorHex: '#F7E7CE' },
  
  // Wool
  { id: 'fab-wool-gray', name: 'Gray Wool', category: 'Fabrics & Leathers', subcategory: 'Wool', description: 'Woven wool fabric', colorHex: '#808080' },
  { id: 'fab-wool-camel', name: 'Camel Wool', category: 'Fabrics & Leathers', subcategory: 'Wool', description: 'Warm camel wool', colorHex: '#C19A6B' },
  
  // Jute & Natural
  { id: 'fab-jute-natural', name: 'Natural Jute', category: 'Fabrics & Leathers', subcategory: 'Jute', description: 'Raw jute fiber', colorHex: '#C4A45C' },
  { id: 'fab-jute-braided', name: 'Braided Jute', category: 'Fabrics & Leathers', subcategory: 'Jute', description: 'Woven braided jute', colorHex: '#B89B4E' },
  
  // Bouclé
  { id: 'fab-boucle-white', name: 'White Bouclé', category: 'Fabrics & Leathers', subcategory: 'Bouclé', description: 'Looped texture white', colorHex: '#F8F8F8' },
  { id: 'fab-boucle-cream', name: 'Cream Bouclé', category: 'Fabrics & Leathers', subcategory: 'Bouclé', description: 'Creamy bouclé fabric', colorHex: '#FFFDD0' },
  { id: 'fab-boucle-gray', name: 'Gray Bouclé', category: 'Fabrics & Leathers', subcategory: 'Bouclé', description: 'Gray textured bouclé', colorHex: '#9B9B9B' },
  
  // Chenille
  { id: 'fab-chenille-sage', name: 'Sage Chenille', category: 'Fabrics & Leathers', subcategory: 'Chenille', description: 'Soft sage green chenille', colorHex: '#9DC183' },
  { id: 'fab-chenille-taupe', name: 'Taupe Chenille', category: 'Fabrics & Leathers', subcategory: 'Chenille', description: 'Warm taupe chenille', colorHex: '#483C32' },
  
  // Genuine Leather
  { id: 'leather-full-grain-tan', name: 'Full Grain Tan Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Premium full grain leather', colorHex: '#D2B48C', properties: { grade: 'Full Grain' } },
  { id: 'leather-full-grain-black', name: 'Full Grain Black Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Premium black full grain', colorHex: '#1C1C1C', properties: { grade: 'Full Grain' } },
  { id: 'leather-full-grain-brown', name: 'Full Grain Brown Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Rich brown full grain', colorHex: '#654321', properties: { grade: 'Full Grain' } },
  { id: 'leather-top-grain-cognac', name: 'Top Grain Cognac Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Cognac top grain leather', colorHex: '#9A463D', properties: { grade: 'Top Grain' } },
  { id: 'leather-top-grain-burgundy', name: 'Top Grain Burgundy Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Deep burgundy leather', colorHex: '#800020', properties: { grade: 'Top Grain' } },
  { id: 'leather-top-grain-olive', name: 'Top Grain Olive Leather', category: 'Fabrics & Leathers', subcategory: 'Genuine Leather', description: 'Olive green leather', colorHex: '#556B2F', properties: { grade: 'Top Grain' } },
  
  // Suede & Nubuck
  { id: 'leather-suede-tan', name: 'Tan Suede', category: 'Fabrics & Leathers', subcategory: 'Suede', description: 'Soft tan suede leather', colorHex: '#D2B48C' },
  { id: 'leather-suede-gray', name: 'Gray Suede', category: 'Fabrics & Leathers', subcategory: 'Suede', description: 'Soft gray suede', colorHex: '#808080' },
  { id: 'leather-nubuck-natural', name: 'Natural Nubuck', category: 'Fabrics & Leathers', subcategory: 'Nubuck', description: 'Buffed grain nubuck', colorHex: '#C4A35A' },
  
  // Faux Leather & PU
  { id: 'leather-faux-black', name: 'Black Faux Leather', category: 'Fabrics & Leathers', subcategory: 'Faux Leather', description: 'Vegan leather alternative', colorHex: '#1A1A1A' },
  { id: 'leather-faux-white', name: 'White Faux Leather', category: 'Fabrics & Leathers', subcategory: 'Faux Leather', description: 'White vegan leather', colorHex: '#F5F5F5' },
  { id: 'leather-faux-camel', name: 'Camel Faux Leather', category: 'Fabrics & Leathers', subcategory: 'Faux Leather', description: 'Camel vegan leather', colorHex: '#C19A6B' },
  { id: 'leather-pu-brown', name: 'Brown PU Leather', category: 'Fabrics & Leathers', subcategory: 'PU Leather', description: 'Polyurethane leather', colorHex: '#8B4513' },
  { id: 'leather-pu-navy', name: 'Navy PU Leather', category: 'Fabrics & Leathers', subcategory: 'PU Leather', description: 'Navy blue PU leather', colorHex: '#000080' },
  
  // Microfiber
  { id: 'fab-microfiber-gray', name: 'Gray Microfiber', category: 'Fabrics & Leathers', subcategory: 'Microfiber', description: 'Stain resistant microfiber', colorHex: '#696969', properties: { waterResistant: true } },
  { id: 'fab-microfiber-beige', name: 'Beige Microfiber', category: 'Fabrics & Leathers', subcategory: 'Microfiber', description: 'Durable beige microfiber', colorHex: '#F5F5DC', properties: { waterResistant: true } },
  { id: 'fab-microfiber-charcoal', name: 'Charcoal Microfiber', category: 'Fabrics & Leathers', subcategory: 'Microfiber', description: 'Dark microfiber fabric', colorHex: '#36454F', properties: { waterResistant: true } },
  
  // Performance fabrics
  { id: 'fab-performance-white', name: 'White Performance Fabric', category: 'Fabrics & Leathers', subcategory: 'Performance', description: 'Stain & water resistant', colorHex: '#FFFFFF', properties: { waterResistant: true, scratchResistant: true } },
  { id: 'fab-performance-navy', name: 'Navy Performance Fabric', category: 'Fabrics & Leathers', subcategory: 'Performance', description: 'Outdoor grade fabric', colorHex: '#000080', properties: { waterResistant: true, scratchResistant: true } },
  { id: 'fab-outdoor-gray', name: 'Gray Outdoor Fabric', category: 'Fabrics & Leathers', subcategory: 'Performance', description: 'UV & weather resistant', colorHex: '#808080', properties: { waterResistant: true } },
];

// Helper functions
export function getMaterialsByCategory(category: MaterialCategory): MaterialItem[] {
  if (category === 'All') {
    return MATERIALS_LIBRARY;
  }
  return MATERIALS_LIBRARY.filter(m => m.category === category);
}

export function getMaterialsBySubcategory(subcategory: string): MaterialItem[] {
  return MATERIALS_LIBRARY.filter(m => m.subcategory === subcategory);
}

export function searchMaterials(query: string, category: MaterialCategory = 'All'): MaterialItem[] {
  const materials = getMaterialsByCategory(category);
  if (!query.trim()) return materials;
  
  const lowerQuery = query.toLowerCase();
  return materials.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) ||
    m.category.toLowerCase().includes(lowerQuery) ||
    m.subcategory.toLowerCase().includes(lowerQuery) ||
    m.description?.toLowerCase().includes(lowerQuery)
  );
}

export function getSubcategoriesForCategory(category: MaterialCategory): string[] {
  if (category === 'All') {
    const allSubcategories = new Set(MATERIALS_LIBRARY.map(m => m.subcategory));
    return Array.from(allSubcategories).sort();
  }
  const materials = getMaterialsByCategory(category);
  const subcategories = new Set(materials.map(m => m.subcategory));
  return Array.from(subcategories).sort();
}

export function getMaterialCount(category: MaterialCategory): number {
  return getMaterialsByCategory(category).length;
}
