import { supabase } from "@/integrations/supabase/client";

export interface ProductExtraction {
  name: string;
  category: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  placementInstruction?: string;
  zone?: string;
  description: string;
}

export interface FloorPlanExtraction {
  detected: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  zones: Array<{ name: string; products: string[] }>;
}

export interface StyleReference {
  type: 'room_photo' | 'texture' | 'material' | 'art';
  boundingBox: { x: number; y: number; width: number; height: number };
  description: string;
}

export interface TextAnnotation {
  text: string;
  context: string;
  isPlacementInstruction: boolean;
}

export interface MoodBoardAnalysis {
  products: ProductExtraction[];
  floorPlan: FloorPlanExtraction | null;
  styleReferences: StyleReference[];
  colorPalette: string[];
  textAnnotations: TextAnnotation[];
  overallStyle: string;
  designNotes: string;
}

export interface MoodBoard {
  id: string;
  project_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  analysis: MoodBoardAnalysis | null;
  extracted_products: ProductExtraction[] | null;
  extracted_styles: StyleReference[] | null;
  placement_instructions: TextAnnotation[] | null;
  floor_plan_url: string | null;
  status: 'pending' | 'analyzing' | 'ready' | 'error';
  created_at: string;
}

export interface MoodBoardProduct {
  id: string;
  mood_board_id: string;
  name: string;
  category: string | null;
  image_url: string;
  description: string | null;
  placement_zone: string | null;
  placement_instruction: string | null;
  position_in_layout: { x: number; y: number; width: number; height: number } | null;
  linked_catalog_id: string | null;
  created_at: string;
}

export async function uploadMoodBoard(
  file: File,
  projectId: string,
  userId: string
): Promise<{ moodBoard: MoodBoard; fileUrl: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('mood-boards')
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('mood-boards')
    .getPublicUrl(fileName);

  const { data: moodBoard, error: insertError } = await supabase
    .from('mood_boards')
    .insert({
      project_id: projectId,
      user_id: userId,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type.includes('pdf') ? 'pdf' : 'image',
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create mood board record: ${insertError.message}`);
  }

  return { moodBoard: moodBoard as unknown as MoodBoard, fileUrl: publicUrl };
}

export async function analyzeMoodBoard(
  moodBoardId: string,
  imageUrls: string[]
): Promise<MoodBoardAnalysis> {
  // Update status to analyzing
  await supabase
    .from('mood_boards')
    .update({ status: 'analyzing' })
    .eq('id', moodBoardId);

  try {
    const { data, error } = await supabase.functions.invoke('analyze-mood-board', {
      body: { imageUrls }
    });

    if (error || !data.success) {
      throw new Error(error?.message || data?.error || 'Analysis failed');
    }

    const analysis = data.analysis as MoodBoardAnalysis;

    // Update mood board with analysis results
    await supabase
      .from('mood_boards')
      .update({
        analysis: JSON.parse(JSON.stringify(analysis)),
        extracted_products: JSON.parse(JSON.stringify(analysis.products || [])),
        extracted_styles: JSON.parse(JSON.stringify(analysis.styleReferences || [])),
        placement_instructions: JSON.parse(JSON.stringify(analysis.textAnnotations?.filter(t => t.isPlacementInstruction) || [])),
        status: 'ready'
      })
      .eq('id', moodBoardId);

    return analysis;
  } catch (error) {
    await supabase
      .from('mood_boards')
      .update({ status: 'error' })
      .eq('id', moodBoardId);
    throw error;
  }
}

export async function cropAndSaveProducts(
  moodBoardId: string,
  fileUrl: string,
  products: ProductExtraction[],
  userId: string
): Promise<MoodBoardProduct[]> {
  // For now, we'll store products with the original image URL
  // In a production system, you'd crop individual product images
  const productRecords = products.map(product => ({
    mood_board_id: moodBoardId,
    name: product.name,
    category: product.category,
    image_url: fileUrl, // Would be cropped image in production
    description: product.description,
    placement_zone: product.zone || null,
    placement_instruction: product.placementInstruction || null,
    position_in_layout: product.boundingBox
  }));

  const { data, error } = await supabase
    .from('mood_board_products')
    .insert(productRecords)
    .select();

  if (error) {
    throw new Error(`Failed to save products: ${error.message}`);
  }

  return data as unknown as MoodBoardProduct[];
}

export async function getMoodBoards(projectId: string): Promise<MoodBoard[]> {
  const { data, error } = await supabase
    .from('mood_boards')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch mood boards: ${error.message}`);
  }

  return data as unknown as MoodBoard[];
}

export async function getMoodBoardProducts(moodBoardId: string): Promise<MoodBoardProduct[]> {
  const { data, error } = await supabase
    .from('mood_board_products')
    .select('*')
    .eq('mood_board_id', moodBoardId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch mood board products: ${error.message}`);
  }

  return data as unknown as MoodBoardProduct[];
}

export async function deleteMoodBoard(moodBoardId: string): Promise<void> {
  const { error } = await supabase
    .from('mood_boards')
    .delete()
    .eq('id', moodBoardId);

  if (error) {
    throw new Error(`Failed to delete mood board: ${error.message}`);
  }
}

export function buildRenderPromptFromMoodBoard(
  analysis: MoodBoardAnalysis,
  zoneName?: string
): string {
  const parts: string[] = [];

  // Add overall style
  if (analysis.overallStyle) {
    parts.push(`Design Style: ${analysis.overallStyle}`);
  }

  // Add products for the zone
  const zoneProducts = zoneName
    ? analysis.products.filter(p => 
        p.zone?.toLowerCase().includes(zoneName.toLowerCase()) ||
        p.placementInstruction?.toLowerCase().includes(zoneName.toLowerCase())
      )
    : analysis.products;

  if (zoneProducts.length > 0) {
    const productDescriptions = zoneProducts.map(p => {
      let desc = `${p.name} (${p.category})`;
      if (p.description) desc += `: ${p.description}`;
      if (p.placementInstruction) desc += ` - ${p.placementInstruction}`;
      return desc;
    });
    parts.push(`Products to include:\n${productDescriptions.join('\n')}`);
  }

  // Add placement instructions
  const placements = analysis.textAnnotations.filter(t => t.isPlacementInstruction);
  if (placements.length > 0) {
    parts.push(`Placement Notes:\n${placements.map(p => p.text).join('\n')}`);
  }

  // Add color palette
  if (analysis.colorPalette?.length > 0) {
    parts.push(`Color Palette: ${analysis.colorPalette.join(', ')}`);
  }

  return parts.join('\n\n');
}
