import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { StoriesBar } from "@/components/StoriesBar";
import { fetchFeedPosts } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeedPosts(user?.id)
      .then((data) => !cancelled && setPosts(data))
      .catch((err) => {
        console.error(err);
        toast.error("Couldn't load feed");
        if (!cancelled) setPosts([]);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const updatePost = (next: FeedPost) =>
    setPosts((prev) => prev?.map((p) => (p.id === next.id ? next : p)) ?? prev);

  return (
    <Layout>
      <div className="mb-6 hidden md:block">
        <h1 className="font-display font-extrabold text-3xl">Your feed</h1>
        <p className="text-muted-foreground mt-1">Latest moments from people you follow.</p>
      </div>

      <StoriesBar />

      {posts === null && (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="w-full aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {posts?.length === 0 && (
        <div className="text-center py-20 bg-card rounded-2xl shadow-card">
          <div className="inline-flex p-4 rounded-2xl gradient-brand mb-4">
            <ImagePlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">No posts yet</h2>
          <p className="text-muted-foreground mb-6">Be the first to share a moment.</p>
          <Button asChild className="gradient-brand text-white border-0 hover:opacity-90">
            <Link to="/create">Create your first post</Link>
          </Button>
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={updatePost} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Feed;