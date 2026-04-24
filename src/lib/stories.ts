import { supabase } from "@/integrations/supabase/client";

export interface StoryItem {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
}

export interface UserStoryGroup {
  user_id: string;
  username: string;
  avatar_url: string | null;
  stories: StoryItem[];
  latest_at: string;
}

interface RawStory {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export const fetchActiveStoryGroups = async (): Promise<UserStoryGroup[]> => {
  const { data, error } = await supabase
    .from("stories")
    .select("id, user_id, image_url, created_at, expires_at, profiles!stories_user_id_fkey(username, avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    // Fallback without explicit FK hint if relationship name differs
    const { data: data2, error: err2 } = await supabase
      .from("stories")
      .select("id, user_id, image_url, created_at, expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (err2) throw err2;
    const userIds = Array.from(new Set((data2 ?? []).map((s) => s.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    return groupStories(
      (data2 ?? []).map((s) => ({
        ...s,
        profiles: map.get(s.user_id)
          ? { username: map.get(s.user_id)!.username, avatar_url: map.get(s.user_id)!.avatar_url }
          : null,
      })) as RawStory[],
    );
  }

  return groupStories((data ?? []) as unknown as RawStory[]);
};

const groupStories = (rows: RawStory[]): UserStoryGroup[] => {
  const groups = new Map<string, UserStoryGroup>();
  for (const r of rows) {
    const existing = groups.get(r.user_id);
    const item: StoryItem = {
      id: r.id,
      user_id: r.user_id,
      image_url: r.image_url,
      created_at: r.created_at,
      expires_at: r.expires_at,
    };
    if (existing) {
      existing.stories.push(item);
      if (r.created_at > existing.latest_at) existing.latest_at = r.created_at;
    } else {
      groups.set(r.user_id, {
        user_id: r.user_id,
        username: r.profiles?.username ?? "user",
        avatar_url: r.profiles?.avatar_url ?? null,
        stories: [item],
        latest_at: r.created_at,
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => (a.latest_at > b.latest_at ? -1 : 1));
};