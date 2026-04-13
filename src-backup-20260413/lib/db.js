import { supabase } from "./supabase.js";

// ═══════════════════════════════════════
// USERS (soft auth)
// ═══════════════════════════════════════

/** Find or create user by email */
export async function ensureUser(email, name) {
  if (!supabase) return null;
  // Try to find existing
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (existing) return existing;

  // Create new
  const { data, error } = await supabase
    .from("users")
    .insert({ email, name })
    .select()
    .single();
  if (error) { console.error("ensureUser error:", error); return null; }
  return data;
}

// ═══════════════════════════════════════
// CHILDREN
// ═══════════════════════════════════════

export async function getChildren(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) { console.error("getChildren error:", error); return []; }
  return data;
}

export async function addChild(userId, name, age) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("children")
    .insert({ user_id: userId, name, age })
    .select()
    .single();
  if (error) { console.error("addChild error:", error); return null; }
  return data;
}

export async function deleteChild(childId) {
  if (!supabase) return;
  await supabase.from("children").delete().eq("id", childId);
}

// ═══════════════════════════════════════
// BOOKS (SKZ-9: Library)
// ═══════════════════════════════════════

/** Create a book record when session starts */
export async function createBook({ childId, characterId, premise, artStyle, lang }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("books")
    .insert({
      child_id: childId,
      character_id: characterId || null,
      title: (premise || "Story").slice(0, 60),
      premise,
      art_style: artStyle,
      lang,
    })
    .select()
    .single();
  if (error) { console.error("createBook error:", error); return null; }
  return data;
}

/** Save a page to existing book (called after each choice) */
export async function savePage(bookId, page) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("book_pages")
    .upsert({
      book_id: bookId,
      page_number: page.pageNumber,
      title: page.title,
      text: page.text,
      tts_text: page.ttsText,
      scene: page.scene,
      scene_summary: page.sceneSummary,
      action_summary: page.actionSummary,
      mood: page.mood,
      image_url: page.imageUrl,
      sfx: page.sfx,
      choice_label: page.choiceLabel,
      choice_value: page.choiceValue,
      is_end: page.isEnd || false,
    }, { onConflict: "book_id,page_number" })
    .select()
    .single();
  if (error) { console.error("savePage error:", error); return null; }

  // Update book page_count and cover if first page
  const updates = { page_count: page.pageNumber };
  if (page.pageNumber === 1 && page.imageUrl) {
    updates.cover_image_url = page.imageUrl;
  }
  await supabase.from("books").update(updates).eq("id", bookId);

  return data;
}

/** Finalize book when session ends */
export async function finalizeBook(bookId, { title, endingType, durationSeconds, pageCount }) {
  if (!supabase) return;
  await supabase
    .from("books")
    .update({
      title,
      ending_type: endingType,
      duration_seconds: durationSeconds,
      page_count: pageCount,
    })
    .eq("id", bookId);
}

/** Save aggregated values for a book */
export async function saveBookValues(bookId, valuesMap) {
  if (!supabase) return;
  const rows = Object.entries(valuesMap)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ book_id: bookId, value_key: key, count }));
  if (rows.length === 0) return;
  await supabase.from("book_values").insert(rows);
}

// ═══════════════════════════════════════
// LIBRARY QUERIES (SKZ-9)
// ═══════════════════════════════════════

/** Get all books for a child (library view) */
export async function getBooks(childId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("books")
    .select("*, character:characters(name, portrait_url)")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) { console.error("getBooks error:", error); return []; }
  return data;
}

/** Get all books across all children for a user */
export async function getAllBooks(userId) {
  if (!supabase) return [];
  // Get children IDs first
  const { data: kids } = await supabase
    .from("children")
    .select("id")
    .eq("user_id", userId);
  if (!kids || kids.length === 0) return [];

  const childIds = kids.map(k => k.id);
  const { data, error } = await supabase
    .from("books")
    .select("*, child:children(name, age), character:characters(name, portrait_url)")
    .in("child_id", childIds)
    .not("ending_type", "is", null) // only completed books
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllBooks error:", error); return []; }
  return data;
}

/** Get full book with all pages (for reading) */
export async function getBookWithPages(bookId) {
  if (!supabase) return null;
  const { data: book, error: bErr } = await supabase
    .from("books")
    .select("*, child:children(name, age), character:characters(name, portrait_url)")
    .eq("id", bookId)
    .single();
  if (bErr) { console.error("getBook error:", bErr); return null; }

  const { data: pages, error: pErr } = await supabase
    .from("book_pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });
  if (pErr) { console.error("getPages error:", pErr); return null; }

  const { data: values } = await supabase
    .from("book_values")
    .select("*")
    .eq("book_id", bookId);

  return { ...book, pages: pages || [], values: values || [] };
}

/** Delete a book */
export async function deleteBook(bookId) {
  if (!supabase) return;
  // Cascade handles pages and values
  await supabase.from("books").delete().eq("id", bookId);
}

// ═══════════════════════════════════════
// CHARACTERS (SKZ-5 foundation)
// ═══════════════════════════════════════

/** Get characters for a child */
export async function getCharacters(childId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("child_id", childId)
    .order("last_used_at", { ascending: false });
  if (error) { console.error("getCharacters error:", error); return []; }
  return data;
}

/** Create a character after first story page */
export async function createCharacter({ childId, name, description, portraitUrl, artStyle, companionIds }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("characters")
    .insert({
      child_id: childId,
      name,
      description,
      portrait_url: portraitUrl,
      art_style: artStyle,
      companion_ids: companionIds || [],
    })
    .select()
    .single();
  if (error) { console.error("createCharacter error:", error); return null; }
  return data;
}

/** Update companion_ids for characters that shared a story */
export async function addCompanionLink(characterId, newCompanionId) {
  if (!supabase) return;
  const { data: char } = await supabase
    .from("characters")
    .select("companion_ids")
    .eq("id", characterId)
    .single();
  if (!char) return;
  const existing = char.companion_ids || [];
  if (existing.includes(newCompanionId)) return;
  await supabase
    .from("characters")
    .update({ companion_ids: [...existing, newCompanionId] })
    .eq("id", characterId);
}

/** Delete a character */
export async function deleteCharacter(characterId) {
  if (!supabase) return;
  await supabase.from("characters").delete().eq("id", characterId);
}

/** Increment story count and update choices */
export async function updateCharacterAfterStory(characterId, newChoices, arcAddition) {
  if (!supabase) return;
  const { data: char } = await supabase
    .from("characters")
    .select("stories_count, total_choices, story_arc")
    .eq("id", characterId)
    .single();
  if (!char) return;

  const merged = { ...(char.total_choices || {}) };
  Object.entries(newChoices).forEach(([k, v]) => {
    merged[k] = (merged[k] || 0) + v;
  });

  // Append to story arc (keep last 5 entries to avoid bloat)
  const existingArc = char.story_arc || [];
  const updatedArc = arcAddition
    ? [...existingArc, arcAddition].slice(-5)
    : existingArc;

  await supabase
    .from("characters")
    .update({
      stories_count: (char.stories_count || 0) + 1,
      total_choices: merged,
      story_arc: updatedArc,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", characterId);
}
