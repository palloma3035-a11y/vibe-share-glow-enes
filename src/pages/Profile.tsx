import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPosts } from "@/lib/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, Camera, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  followUser,
  getFollowCounts,
  isFollowing,
  unfollowUser,
} from "@/lib/follows";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface UserPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<UserPost[] | null>(null);
  const [counts, setCounts] = useState<{ followers: number; following: number } | null>(null);
  const [following, setFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingName, setSavingName] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwn = !!user && !!profile && user.id === profile.id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error("Couldn't load profile");
        setProfile(null);
        return;
      }
      setProfile(data);
      setNewUsername(data.username);
    })();

    fetchUserPosts(id)
      .then((data) => !cancelled && setPosts(data))
      .catch(() => !cancelled && setPosts([]));

    getFollowCounts(id)
      .then((c) => !cancelled && setCounts(c))
      .catch(() => !cancelled && setCounts({ followers: 0, following: 0 }));

    if (user && user.id !== id) {
      isFollowing(user.id, id)
        .then((v) => !cancelled && setFollowing(v))
        .catch(() => !cancelled && setFollowing(false));
    } else {
      setFollowing(false);
    }

    return () => { cancelled = true; };
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!user || !profile || followPending) return;
    setFollowPending(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setCounts((c) =>
      c ? { ...c, followers: c.followers + (wasFollowing ? -1 : 1) } : c,
    );
    try {
      if (wasFollowing) {
        await unfollowUser(user.id, profile.id);
      } else {
        await followUser(user.id, profile.id);
      }
    } catch (err) {
      // revert
      setFollowing(wasFollowing);
      setCounts((c) =>
        c ? { ...c, followers: c.followers + (wasFollowing ? 1 : -1) } : c,
      );
      toast.error(wasFollowing ? "Couldn't unfollow" : "Couldn't follow");
    } finally {
      setFollowPending(false);
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file || !user || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", user.id);
    setUploading(false);
    if (updErr) {
      toast.error(updErr.message);
      return;
    }
    setProfile({ ...profile, avatar_url: pub.publicUrl });
    toast.success("Avatar updated");
  };

  const saveUsername = async () => {
    if (!user || !profile) return;
    const trimmed = newUsername.trim();
    if (!trimmed) {
      toast.error("Username can't be empty");
      return;
    }
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(trimmed)) {
      toast.error("3–30 chars: letters, numbers, _ or .");
      return;
    }
    if (trimmed === profile.username) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);
    setSavingName(false);
    if (error) {
      if (error.code === "23505") toast.error("Username already taken");
      else toast.error(error.message);
      return;
    }
    setProfile({ ...profile, username: trimmed });
    setEditing(false);
    toast.success("Username updated");
  };

  return (
    <Layout>
      <header className="flex items-center gap-5 md:gap-8 mb-8">
        {profile ? (
          <div className="relative shrink-0">
            <div className="p-[3px] rounded-full gradient-brand">
              <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-background">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                <AvatarFallback className="bg-secondary text-2xl font-bold">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    "absolute bottom-0 right-0 h-9 w-9 rounded-full gradient-brand text-white",
                    "flex items-center justify-center border-2 border-background shadow-elevated",
                    "hover:scale-110 transition-smooth disabled:opacity-70",
                  )}
                  aria-label="Change avatar"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                />
              </>
            )}
          </div>
        ) : (
          <Skeleton className="h-20 w-20 md:h-28 md:w-28 rounded-full" />
        )}
        <div className="flex-1 min-w-0">
          {profile ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {editing ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-display font-extrabold text-2xl md:text-3xl">@</span>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      maxLength={30}
                      className="h-10 max-w-[220px] text-lg font-semibold"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={saveUsername}
                      disabled={savingName}
                      className="gradient-brand text-white border-0"
                      aria-label="Save username"
                    >
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setNewUsername(profile.username);
                      }}
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-display font-extrabold text-2xl md:text-3xl truncate">
                      @{profile.username}
                    </h1>
                    {isOwn ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditing(true)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : user ? (
                      <Button
                        size="sm"
                        onClick={toggleFollow}
                        disabled={followPending}
                        className={cn(
                          following
                            ? "bg-secondary text-foreground hover:bg-secondary/80"
                            : "gradient-brand text-white border-0 hover:opacity-90",
                        )}
                      >
                        {following ? "Following" : "Follow"}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
              <div className="flex gap-5 text-sm">
                <span>
                  <span className="font-bold">{posts?.length ?? "—"}</span>{" "}
                  <span className="text-muted-foreground">posts</span>
                </span>
                <span>
                  <span className="font-bold">{counts?.followers ?? "—"}</span>{" "}
                  <span className="text-muted-foreground">followers</span>
                </span>
                <span>
                  <span className="font-bold">{counts?.following ?? "—"}</span>{" "}
                  <span className="text-muted-foreground">following</span>
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-7 w-40" />
          )}
        </div>
      </header>

      <div className="border-t border-border pt-6">
        {posts === null ? (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ImageOff className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p>No posts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-secondary group">
                <img
                  src={p.image_url}
                  alt={p.caption ?? "Post"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;