export type ActivityType =
  | "wheel"
  | "card"
  | "match"
  | "group-sort"
  | "quiz"
  | "missing-word"
  | "memory"
  | "balloon-pop";

export type CardDisplayMode = "grid" | "stack";
export type BalloonDisplayMode = "pop" | "read";
export type DisplayMode = CardDisplayMode | BalloonDisplayMode;

export interface ActivityOption {
  id: string;
  text?: string;
  imageUrl?: string;
  // match: the paired item
  pairText?: string;
  pairImageUrl?: string;
  // group-sort: category name
  group?: string;
  // quiz, missing-word, balloon-pop: correct answer marker
  isCorrect?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  display_mode: DisplayMode | null;
  theme: string;
  category: string | null;
  show_feedback: boolean;
  options: ActivityOption[];
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityPayload {
  title: string;
  type: ActivityType;
  display_mode: DisplayMode | null;
  theme: string;
  category: string | null;
  show_feedback?: boolean;
  options: ActivityOption[];
}
