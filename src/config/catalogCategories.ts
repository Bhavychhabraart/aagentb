export interface SubcategoryConfig {
  id: string;
  label: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  subcategories: SubcategoryConfig[];
}

export const CATALOG_CATEGORIES: CategoryConfig[] = [
  {
    id: 'Seating',
    label: 'FURNITURE',
    subcategories: [
      { id: 'Sofas', label: 'Sofas' },
      { id: 'Armchairs', label: 'Armchairs' },
      { id: 'Dining Chairs', label: 'Dining Chairs' },
      { id: 'Lounge Chairs', label: 'Lounge Chairs' },
      { id: 'Stools', label: 'Stools' },
      { id: 'Benches', label: 'Benches' },
    ]
  },
  {
    id: 'Outdoor',
    label: 'OUTDOOR FURNITURE',
    subcategories: [
      { id: 'Outdoor Chairs', label: 'Outdoor Chairs' },
      { id: 'Outdoor Sofas', label: 'Outdoor Sofas' },
      { id: 'Outdoor Tables', label: 'Outdoor Tables' },
    ]
  },
  {
    id: 'Hospitality',
    label: 'HOSPITALITY FURNITURE',
    subcategories: [
      { id: 'Hospitality Lounge Chairs', label: 'Lounge Chairs' },
      { id: 'Hospitality Dining Chairs', label: 'Dining Chairs' },
      { id: 'Bar Chairs', label: 'Bar Chairs' },
      { id: 'Hospitality Sofas', label: 'Hospitality Sofas' },
      { id: 'Coffee Tables', label: 'Coffee Tables' },
      { id: 'Dining Tables', label: 'Dining Tables' },
      { id: 'Bar Tables', label: 'Bar Tables' },
    ]
  },
  {
    id: 'Art',
    label: 'ART',
    subcategories: [
      { id: 'Paintings', label: 'Paintings' },
      { id: 'Prints', label: 'Prints' },
      { id: 'Sculptures', label: 'Sculptures' },
    ]
  },
  {
    id: 'Rugs',
    label: 'RUGS',
    subcategories: [
      { id: 'Hand-Knotted', label: 'Hand-Knotted' },
      { id: 'Hand-Tufted', label: 'Hand-Tufted' },
      { id: 'Flat Weave', label: 'Flat Weave' },
    ]
  },
  {
    id: 'Lighting',
    label: 'LIGHTING',
    subcategories: [
      { id: 'Table Lamps', label: 'Table Top Lamp' },
      { id: 'Ceiling & Wall Lights', label: 'Ceiling & Wall Lights' },
      { id: 'Floor Lamps', label: 'Floor Lamps' },
    ]
  },
  {
    id: 'Decor',
    label: 'DECOR',
    subcategories: [
      { id: 'Muted Decor', label: 'Muted Decor' },
      { id: 'Trays & Bowls', label: 'Trays/Pots & Bowls' },
      { id: 'Vases & Planters', label: 'Vases & Table Top Planters' },
      { id: 'Floor Planters', label: 'Floor Planters' },
      { id: 'Brass Decor', label: 'Brass Decor' },
      { id: 'Maximal Decor', label: 'Maximal Decor' },
    ]
  },
  {
    id: 'Walls',
    label: 'WALLS',
    subcategories: [
      { id: 'Mirrors', label: 'Mirrors' },
      { id: 'Wallpapers', label: 'Wallpapers' },
    ]
  },
  {
    id: 'Mosaics',
    label: 'MOSAICS',
    subcategories: [
      { id: 'Floor Mosaics', label: 'Floor Mosaics' },
      { id: 'Wall Mosaics', label: 'Wall Mosaics' },
    ]
  },
  {
    id: 'Tables',
    label: 'TABLES',
    subcategories: [
      { id: 'Coffee Tables', label: 'Coffee Tables' },
      { id: 'Side Tables', label: 'Side Tables' },
      { id: 'Console Tables', label: 'Console Tables' },
      { id: 'Dining Tables', label: 'Dining Tables' },
    ]
  },
  {
    id: 'Storage',
    label: 'STORAGE',
    subcategories: [
      { id: 'Cabinets', label: 'Cabinets' },
      { id: 'Shelves', label: 'Shelves' },
      { id: 'TV Units', label: 'TV Units' },
    ]
  },
  {
    id: 'Bedroom',
    label: 'BEDROOM',
    subcategories: [
      { id: 'Beds', label: 'Beds' },
      { id: 'Nightstands', label: 'Nightstands' },
      { id: 'Dressers', label: 'Dressers' },
    ]
  },
];

// Helper to get all category IDs
export const getAllCategoryIds = (): string[] => 
  CATALOG_CATEGORIES.map(c => c.id);

// Helper to get subcategories for a category
export const getSubcategoriesForCategory = (categoryId: string): SubcategoryConfig[] => 
  CATALOG_CATEGORIES.find(c => c.id === categoryId)?.subcategories || [];

// Helper to find category by subcategory
export const getCategoryBySubcategory = (subcategoryId: string): string | null => {
  for (const cat of CATALOG_CATEGORIES) {
    if (cat.subcategories.some(s => s.id === subcategoryId)) {
      return cat.id;
    }
  }
  return null;
};
