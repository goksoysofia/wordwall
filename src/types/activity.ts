export type ActivityType = "wheel" | "card";
export type CardDisplayMode = "grid" | "stack";

export interface ActivityOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  display_mode: CardDisplayMode | null;
  theme: string;
  options: ActivityOption[];
  created_at: string;
  updated_at: string;
}

export interface CreateActivityPayload {
  title: string;
  type: ActivityType;
  display_mode: CardDisplayMode | null;
  theme: string;
  options: ActivityOption[];
}
