import { supabaseAdmin } from '../db/supabase.js';

/** Transliterate Russian → Latin for URL slug */
export function transliterate(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
    'ь':'','э':'e','ю':'yu','я':'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/** Find unique slug: try base, then base-2, base-3, etc. */
export async function findUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await supabaseAdmin
      .from('clinics').select('id').eq('slug', slug).limit(1);
    if (!data?.length) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
    if (attempt > 20) throw new Error('Cannot generate unique slug');
  }
}
