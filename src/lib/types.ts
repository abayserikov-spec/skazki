// ─── App user (local auth) ───
export interface AppUser {
  name: string;
  email: string;
}

// ─── DB entities ───
export interface DbUser {
  id: string;
  email: string;
  name: string;
}

export interface Child {
  id: string;
  user_id?: string;
  name: string;
  age: number | string;
  created_at?: string;
}

export interface Character {
  id: string;
  child_id?: string;
  name: string;
  description: string;
  portrait_url: string | null;
  art_style?: string;
  companion_ids?: string[];
  stories_count?: number;
  total_choices?: Record<string, number>;
  story_arc?: string[];
  last_used_at?: string;
}

export interface Book {
  id: string;
  child_id?: string;
  character_id?: string | null;
  title?: string;
  premise?: string;
  art_style?: string;
  lang?: string;
  ending_type?: "good" | "mixed" | "sad" | null;
  duration_seconds?: number | null;
  page_count?: number;
  cover_image_url?: string | null;
  created_at: string;
  child?: { name: string; age: number | string };
  character?: {
    id?: string;
    name?: string;
    description?: string;
    portrait_url?: string | null;
    story_arc?: string[];
  };
  pages?: BookPage[];
  values?: BookValue[];
}

export interface BookPage {
  id?: string;
  book_id?: string;
  page_number?: number;
  title?: string;
  text?: string;
  tts_text?: string;
  scene?: string;
  scene_summary?: string;
  action_summary?: string;
  mood?: string;
  image_url?: string | null;
  sfx?: string;
  choice_label?: string;
  choice_value?: string;
  is_end?: boolean;
}

export interface BookValue {
  id?: string;
  book_id?: string;
  value_key: string;
  count: number;
}

// ─── Story session types ───
export interface Choice {
  label: string;
  emoji?: string;
  value: string;
}

export interface StoryPage {
  text?: string;
  tts_text?: string;
  mood?: string;
  scene?: string;
  sceneSummary?: string;
  actionSummary?: string;
  cameraAngle?: string;
  textZone?: string;
  intensity?: number;
  title?: string;
  sfx?: string;
  characterDesc?: string;
  characterName?: string;
  identityTag?: string;
  newMainCharacter?: string;
  newCharacterName?: string;
  choices?: Choice[];
  isEnd?: boolean;
  ending?: "good" | "mixed" | "sad";
  storySummary?: string;
  illustration?: string;
}

export interface SessionPage extends StoryPage {
  imgUrl: string | null;
  choice?: Choice;
}

export interface Pick {
  label: string;
  value: string;
  page: number;
}

export interface Preset {
  text: string;
}

export interface StoryTheme {
  id: string;
  name: string;
  prompt: string;
}

export interface Session {
  id: string;
  child: Child | null;
  theme: StoryTheme | null;
  pages: SessionPage[];
  picks: Pick[];
  duration: number;
  date: number;
  charDesc: string | null;
  backstory: string;
}

export interface ValEntry {
  k: string;
  n: string;
  nEn: string;
  c: string;
  pos: boolean;
  count: number;
  pct: number;
}

// ─── Flipbook ref ───
export interface FlipBookRef {
  pageFlip: () => unknown;
  flipNext: () => void;
  flipPrev: () => void;
  flip: (page: number) => void;
  getCurrentPageIndex: () => number | undefined;
  getPageCount: () => number | undefined;
  destroy: () => void;
  startAutoFlip: (delay?: number, direction?: "next" | "prev") => void;
  stopAutoFlip: () => void;
}

// ─── Image gen opts ───
export interface ImageGenOpts {
  styleRefUrl?: string;
}

export interface TextRenderOpts {
  color?: string;
  bgColor?: string | null;
  fontSize?: number;
  maxWidth?: number;
}

export interface CompressOpts {
  maxSize?: number;
  quality?: number;
}
