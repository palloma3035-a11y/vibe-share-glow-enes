import { supabase } from "@/integrations/supabase/client";

export const getFollowCounts = async (userId: string) => {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
};

export const isFollowing = async (followerId: string, followingId: string) => {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
};

export const followUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
};

export const searchUsers = async (query: string, limit = 20) => {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", `%${q}%`)
    .order("username", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};