import { supabase } from "@/integrations/supabase/client";
import type { FeedPost } from "@/components/PostCard";

interface RawPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export const fetchFeedPosts = async (currentUserId?: string): Promise<FeedPost[]> => {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, image_url, caption, created_at, profiles!posts_user_id_fkey(username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const rows = (posts ?? []) as unknown as RawPost[];
  if (rows.length === 0) return [];

  const ids = rows.map((p) => p.id);
  const { data: likeRows } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", ids);

  const likes = likeRows ?? [];
  return rows.map((p) => {
    const postLikes = likes.filter((l) => l.post_id === p.id);
    return {
      id: p.id,
      user_id: p.user_id,
      image_url: p.image_url,
      caption: p.caption,
      created_at: p.created_at,
      username: p.profiles?.username ?? "user",
      avatar_url: p.profiles?.avatar_url ?? null,
      likes_count: postLikes.length,
      liked_by_me: !!currentUserId && postLikes.some((l) => l.user_id === currentUserId),
    };
  });
};

export const fetchUserPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select("id, image_url, caption, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};