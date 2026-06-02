import { supabase } from "lib/supabase";
import type { Book, BookPage, Character, Child, DbUser } from "lib/types";

// ═══════════════════════════════════════
// USERS (soft auth)
// ═══════════════════════════════════════

/** Find or create user by email.
 *  Falls back to the Supabase auth user when public.users doesn't exist. */
export async function ensureUser(
  email: string,
  name: string,
): Promise<DbUser | null> {
  if (!supabase) return null;
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  try {
    const { data: existing, error: findErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (findErr?.code === "PGRST116") {
      // No row yet — fall through to insert
    } else if (findErr) {
      throw findErr;
    } else if (existing) {
      return existing as DbUser;
    }

    const { data, error } = await supabase
      .from("users")
      .insert({ id: authUser.id, email, name })
      .select()
      .single();
    if (error) throw error;
    return data as DbUser;
  } catch (err: unknown) {
    console.error("ensureUser error:", err);
    return null;
  }
}

// ═══════════════════════════════════════
// CHILDREN
// ═══════════════════════════════════════

export async function getChildren(userId: string): Promise<Child[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getChildren error:", error);
    return [];
  }
  return data;
}

export async function addChild(
  userId: string,
  name: string,
  age: number,
): Promise<Child | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("children")
    .insert({ user_id: userId, name, age })
    .select()
    .single();
  if (error) {
    console.error("addChild error:", error);
    return null;
  }
  return data;
}

export async function deleteChild(childId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("children").delete().eq("id", childId);
}

// ═══════════════════════════════════════
// BOOKS (SKZ-9: Library)
// ═══════════════════════════════════════

/** Create a book record when session starts */
export async function createBook({
  childId,
  characterId,
  premise,
  artStyle,
  lang,
}: {
  childId: string;
  characterId?: string | null;
  premise?: string;
  artStyle?: string;
  lang?: string;
}): Promise<Book | null> {
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
  if (error) {
    console.error("createBook error:", error);
    return null;
  }
  return data;
}

/** Save a page to existing book (called after each choice) */
export async function savePage(
  bookId: string,
  page: {
    pageNumber: number;
    title?: string;
    text?: string;
    ttsText?: string;
    scene?: string;
    sceneSummary?: string;
    actionSummary?: string;
    mood?: string;
    imageUrl?: string | null;
    sfx?: string;
    choiceLabel?: string | null;
    choiceValue?: string | null;
    isEnd?: boolean;
  },
): Promise<BookPage | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("book_pages")
    .upsert(
      {
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
      },
      { onConflict: "book_id,page_number" },
    )
    .select()
    .single();
  if (error) {
    console.error("savePage error:", error);
    return null;
  }

  // Update book page_count and cover if first page
  const updates: { page_count: number; cover_image_url?: string } = {
    page_count: page.pageNumber,
  };
  if (page.pageNumber === 1 && page.imageUrl) {
    updates.cover_image_url = page.imageUrl;
  }
  await supabase.from("books").update(updates).eq("id", bookId);

  return data;
}

/** Finalize book when session ends */
export async function finalizeBook(
  bookId: string,
  {
    title,
    endingType,
    durationSeconds,
    pageCount,
  }: {
    title: string;
    endingType: "good" | "mixed" | "sad";
    durationSeconds: number;
    pageCount: number;
  },
): Promise<void> {
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
export async function saveBookValues(
  bookId: string,
  valuesMap: Record<string, number>,
): Promise<void> {
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
export async function getBooks(childId: string): Promise<Book[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("books")
    .select("*, character:characters(name, portrait_url)")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getBooks error:", error);
    return [];
  }
  return data;
}

/** Get all books across all children for a user */
export async function getAllBooks(userId: string): Promise<Book[]> {
  if (!supabase) return [];
  // Get children IDs first
  const { data: kids } = await supabase
    .from("children")
    .select("id")
    .eq("user_id", userId);
  if (!kids || kids.length === 0) return [];

  const childIds = kids.map((k) => k.id);
  const { data, error } = await supabase
    .from("books")
    .select(
      "*, child:children(name, age), character:characters(name, portrait_url)",
    )
    .in("child_id", childIds)
    // Show all books (finished + in-progress) so user can continue unfinished ones from the library
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllBooks error:", error);
    return [];
  }
  return data;
}

/** Get full book with all pages (for reading) */
export async function getBookWithPages(bookId: string): Promise<Book | null> {
  if (!supabase) return null;
  const { data: book, error: bErr } = await supabase
    .from("books")
    .select(
      "*, child:children(name, age), character:characters(id, name, description, portrait_url, story_arc)",
    )
    .eq("id", bookId)
    .single();
  if (bErr) {
    console.error("getBook error:", bErr);
    return null;
  }

  const { data: pages, error: pErr } = await supabase
    .from("book_pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });
  if (pErr) {
    console.error("getPages error:", pErr);
    return null;
  }

  const { data: values } = await supabase
    .from("book_values")
    .select("*")
    .eq("book_id", bookId);

  return { ...book, pages: pages || [], values: values || [] };
}

/** Delete a book */
export async function deleteBook(bookId: string): Promise<void> {
  if (!supabase) return;
  // Cascade handles pages and values
  await supabase.from("books").delete().eq("id", bookId);
}

// ═══════════════════════════════════════
// CHARACTERS (SKZ-5 foundation)
// ═══════════════════════════════════════

/** Get characters for a child */
export async function getCharacters(childId: string): Promise<Character[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("child_id", childId)
    .order("last_used_at", { ascending: false });
  if (error) {
    console.error("getCharacters error:", error);
    return [];
  }
  return data;
}

/** Create a character after first story page */
export async function createCharacter({
  childId,
  name,
  description,
  portraitUrl,
  artStyle,
  companionIds,
}: {
  childId: string;
  name: string;
  description: string;
  portraitUrl?: string | null;
  artStyle?: string;
  companionIds?: string[];
}): Promise<Character | null> {
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
  if (error) {
    console.error("createCharacter error:", error);
    return null;
  }
  return data;
}

/** Update companion_ids for characters that shared a story */
export async function addCompanionLink(
  characterId: string,
  newCompanionId: string,
): Promise<void> {
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
export async function deleteCharacter(characterId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("characters").delete().eq("id", characterId);
}

/** Increment story count and update choices */
export async function updateCharacterAfterStory(
  characterId: string,
  newChoices: Record<string, number>,
  arcAddition: string | null,
): Promise<void> {
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
