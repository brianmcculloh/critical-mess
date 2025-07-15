import { supabase } from './supabaseClient';

export async function storeHotPocketCreation({
  category,
  base,
  modifier,
  crust,
  seasoning,
  seasoning_style,
  user_id,
}: {
  category: string;
  base: string;
  modifier: string;
  crust: string;
  seasoning: string;
  seasoning_style?: string;
  user_id?: string;
}) {
  const { data, error } = await supabase
    .from('hot_pocket_creations')
    .insert([
      {
        category,
        base,
        modifier,
        crust,
        seasoning,
        seasoning_style,
        user_id,
      }
    ]);
  return { data, error };
}

export async function getHotPocketComboCount({
  category,
  base,
  modifier,
  crust,
  seasoning,
  seasoning_style,
}: {
  category: string;
  base: string;
  modifier: string;
  crust: string;
  seasoning: string;
  seasoning_style?: string;
}) {
  const { count, error } = await supabase
    .from('hot_pocket_creations')
    .select('id', { count: 'exact', head: true })
    .match({
      category,
      base,
      modifier,
      crust,
      seasoning,
      seasoning_style,
    });
  return { count: count ?? 0, error };
} 