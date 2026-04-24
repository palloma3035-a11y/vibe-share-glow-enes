import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActiveStoryGroups, type UserStoryGroup } from "@/lib/stories";
import { useAuth } from "@/hooks/useAuth";
import { StoryViewer } from "./StoryViewer";
import { cn } from "@/lib/utils";

export const StoriesBar = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserStoryGroup[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const reload = () => {
    fetchActiveStoryGroups()
      .then(setGroups)
      .catch(() => setGroups([]));
  };

  useEffect(() => {
    reload();
  }, []);

  // Put the current user's group first if it exists
  const ordered = (() => {
    if (!groups || !user) return groups ?? [];
    const mine = groups.findIndex((g) => g.user_id === user.id);
    if (mine <= 0) return groups;
    const copy = [...groups];
    const [m] = copy.splice(mine, 1);
    return [m, ...copy];
  })();

  const myGroup = user ? groups?.find((g) => g.user_id === user.id) : null;

  return (
    <>
      <div className="bg-card rounded-2xl shadow-card p-4 mb-6 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-1 px-1">
          {/* Add story tile */}
          {user && (
            <Link
              to="/create-story"
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              aria-label="Add story"
            >
              <div className="relative h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-border group-hover:border-foreground/40 transition-smooth">
                {myGroup ? (
                  <div className="p-[2px] rounded-full gradient-brand">
                    <Avatar className="h-[58px] w-[58px] border-2 border-background">
                      <AvatarImage src={myGroup.avatar_url ?? undefined} />
                      <AvatarFallback>{myGroup.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <Plus className="h-6 w-6 text-muted-foreground" />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full gradient-brand flex items-center justify-center border-2 border-background">
                  <Plus className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs font-medium truncate max-w-[64px]">Your story</span>
            </Link>
          )}

          {groups === null &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}

          {ordered
            ?.filter((g) => g.user_id !== user?.id)
            .map((g) => {
              const idx = ordered.indexOf(g);
              return (
                <button
                  key={g.user_id}
                  onClick={() => setViewerIndex(idx)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className={cn("p-[2.5px] rounded-full gradient-brand transition-transform group-hover:scale-105")}>
                    <Avatar className="h-[58px] w-[58px] border-[2.5px] border-background">
                      <AvatarImage src={g.avatar_url ?? undefined} alt={g.username} />
                      <AvatarFallback className="bg-secondary text-sm font-semibold">
                        {g.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[64px]">{g.username}</span>
                </button>
              );
            })}

          {/* Allow tapping own avatar to view own story */}
          {myGroup && (
            <button
              onClick={() => setViewerIndex(ordered.findIndex((g) => g.user_id === user!.id))}
              className="sr-only"
              aria-label="View your story"
            />
          )}
        </div>
      </div>

      {viewerIndex !== null && ordered.length > 0 && (
        <StoryViewer
          groups={ordered}
          startIndex={viewerIndex}
          onClose={() => {
            setViewerIndex(null);
            reload();
          }}
        />
      )}
    </>
  );
};