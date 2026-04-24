import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface FeedPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  liked_by_me: boolean;
}

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
};

export const PostCard = ({ post, onChange }: { post: FeedPost; onChange?: (p: FeedPost) => void }) => {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [animate, setAnimate] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    if (pending) return;
    setPending(true);

    const optimistic: FeedPost = {
      ...post,
      liked_by_me: !post.liked_by_me,
      likes_count: post.likes_count + (post.liked_by_me ? -1 : 1),
    };
    onChange?.(optimistic);
    if (!post.liked_by_me) setAnimate(true);

    if (post.liked_by_me) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id);
      if (error) {
        onChange?.(post);
        toast.error("Couldn't unlike post");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, post_id: post.id });
      if (error) {
        onChange?.(post);
        toast.error("Couldn't like post");
      }
    }
    setPending(false);
    setTimeout(() => setAnimate(false), 400);
  };

  return (
    <article className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in-up">
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 group">
          <div className="relative p-[2px] rounded-full gradient-brand">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={post.avatar_url ?? undefined} alt={post.username} />
              <AvatarFallback className="bg-secondary text-sm font-semibold">
                {post.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:underline">{post.username}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
      </div>

      <button
        onDoubleClick={() => !post.liked_by_me && toggleLike()}
        className="block w-full bg-secondary/40"
        aria-label="Post image"
      >
        <img
          src={post.image_url}
          alt={post.caption ?? `Post by ${post.username}`}
          className="w-full max-h-[640px] object-cover"
          loading="lazy"
        />
      </button>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={pending}
            aria-label={post.liked_by_me ? "Unlike" : "Like"}
            className="transition-smooth hover:scale-110 active:scale-95"
          >
            <Heart
              className={cn(
                "h-7 w-7 transition-colors",
                post.liked_by_me ? "fill-[hsl(var(--like))] text-[hsl(var(--like))]" : "text-foreground",
                animate && "animate-like-pop"
              )}
            />
          </button>
          <button aria-label="Comments (coming soon)" className="opacity-50 cursor-not-allowed">
            <MessageCircle className="h-7 w-7" />
          </button>
        </div>
        <p className="text-sm font-semibold">
          {post.likes_count.toLocaleString()} {post.likes_count === 1 ? "like" : "likes"}
        </p>
        {post.caption && (
          <p className="text-sm leading-relaxed">
            <Link to={`/profile/${post.user_id}`} className="font-semibold mr-2 hover:underline">
              {post.username}
            </Link>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
};