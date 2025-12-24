import { supabase } from "@/integrations/supabase/client";

export type PreferenceCategory = 'style' | 'color' | 'furniture' | 'function' | 'lighting' | 'budget';
export type PreferenceSource = 'agent_b_answer' | 'agent_b_analysis' | 'style_ref' | 'staged_product' | 'render_approved';

export interface DesignPreference {
  id: string;
  user_id: string;
  category: PreferenceCategory;
  preference_key: string;
  weight: number;
  last_used: string;
  created_at: string;
  source: PreferenceSource | null;
}

export interface DesignMemorySettings {
  id: string;
  user_id: string;
  memory_enabled: boolean;
  auto_learn: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesContext {
  styles: Array<{ key: string; weight: number }>;
  colors: Array<{ key: string; weight: number }>;
  furniture: Array<{ key: string; weight: number }>;
  functions: Array<{ key: string; weight: number }>;
  lighting: Array<{ key: string; weight: number }>;
  budget: Array<{ key: string; weight: number }>;
}

// Get all preferences for a user
export async function getUserPreferences(userId: string): Promise<DesignPreference[]> {
  const { data, error } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('weight', { ascending: false });

  if (error) {
    console.error('Failed to fetch preferences:', error);
    return [];
  }

  return (data || []) as DesignPreference[];
}

// Get top N preferences by category
export async function getTopPreferences(
  userId: string, 
  category: PreferenceCategory, 
  limit: number = 5
): Promise<DesignPreference[]> {
  const { data, error } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('weight', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Failed to fetch top ${category} preferences:`, error);
    return [];
  }

  return (data || []) as DesignPreference[];
}

// Get all preferences formatted for AI context
export async function getPreferencesContext(userId: string): Promise<UserPreferencesContext> {
  const preferences = await getUserPreferences(userId);

  const context: UserPreferencesContext = {
    styles: [],
    colors: [],
    furniture: [],
    functions: [],
    lighting: [],
    budget: [],
  };

  for (const pref of preferences) {
    const category = pref.category as keyof UserPreferencesContext;
    if (context[category]) {
      context[category].push({ key: pref.preference_key, weight: pref.weight });
    }
  }

  // Sort each category by weight and limit to top 5
  for (const key of Object.keys(context) as (keyof UserPreferencesContext)[]) {
    context[key] = context[key]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }

  return context;
}

// Record a new preference or increase weight if exists
export async function recordPreference(
  userId: string,
  category: PreferenceCategory,
  preferenceKey: string,
  source: PreferenceSource,
  weightIncrease: number = 1
): Promise<void> {
  // Check if preference exists
  const { data: existing } = await supabase
    .from('design_preferences')
    .select('id, weight')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('preference_key', preferenceKey)
    .maybeSingle();

  if (existing) {
    // Update existing preference - increase weight
    await supabase
      .from('design_preferences')
      .update({
        weight: existing.weight + weightIncrease,
        last_used: new Date().toISOString(),
        source,
      })
      .eq('id', existing.id);
  } else {
    // Create new preference
    await supabase
      .from('design_preferences')
      .insert({
        user_id: userId,
        category,
        preference_key: preferenceKey,
        weight: weightIncrease,
        source,
      });
  }
}

// Record multiple preferences at once
export async function recordPreferences(
  userId: string,
  preferences: Array<{
    category: PreferenceCategory;
    key: string;
    source: PreferenceSource;
    weight?: number;
  }>
): Promise<void> {
  for (const pref of preferences) {
    await recordPreference(userId, pref.category, pref.key, pref.source, pref.weight || 1);
  }
}

// Get user's memory settings
export async function getMemorySettings(userId: string): Promise<DesignMemorySettings | null> {
  const { data, error } = await supabase
    .from('design_memory_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch memory settings:', error);
    return null;
  }

  return data as DesignMemorySettings | null;
}

// Set memory enabled/disabled
export async function setMemoryEnabled(userId: string, enabled: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('design_memory_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('design_memory_settings')
      .update({
        memory_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('design_memory_settings')
      .insert({
        user_id: userId,
        memory_enabled: enabled,
        auto_learn: true,
      });
  }
}

// Set auto-learn enabled/disabled
export async function setAutoLearn(userId: string, enabled: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('design_memory_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('design_memory_settings')
      .update({
        auto_learn: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('design_memory_settings')
      .insert({
        user_id: userId,
        memory_enabled: true,
        auto_learn: enabled,
      });
  }
}

// Clear all preferences (reset memory)
export async function clearMemory(userId: string): Promise<void> {
  await supabase
    .from('design_preferences')
    .delete()
    .eq('user_id', userId);
}

// Delete a specific preference
export async function deletePreference(userId: string, preferenceId: string): Promise<void> {
  await supabase
    .from('design_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('id', preferenceId);
}

// Map Agent B question IDs to preference categories
export function mapQuestionToCategory(questionText: string): PreferenceCategory {
  const text = questionText.toLowerCase();
  
  if (text.includes('function') || text.includes('purpose') || text.includes('use')) {
    return 'function';
  }
  if (text.includes('color') || text.includes('palette') || text.includes('temperature')) {
    return 'color';
  }
  if (text.includes('lighting') || text.includes('mood') || text.includes('brightness')) {
    return 'lighting';
  }
  if (text.includes('budget') || text.includes('cost') || text.includes('price')) {
    return 'budget';
  }
  if (text.includes('furniture') || text.includes('item') || text.includes('element')) {
    return 'furniture';
  }
  
  return 'style';
}
