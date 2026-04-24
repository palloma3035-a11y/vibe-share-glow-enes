import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserStoryGroup } from "@/lib/stories";

const STORY_DURATION_MS = 5000;

const timeAgoShort = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
};

export const StoryViewer = ({
  groups,
  startIndex,
  onClose,
}: {
  groups: UserStoryGroup[];
  startIndex: number;
  onClose: () => void;
}) => {
  const { user } = useAuth();
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const elapsedBefore = useRef<number>(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  // Reset story index when group changes
  useEffect(() => {
    setStoryIdx(0);
  }, [groupIdx]);

  // Reset timing when story changes
  useEffect(() => {
    startedAt.current = Date.now();
    elapsedBefore.current = 0;
    setProgress(0);
  }, [groupIdx, storyIdx]);

  // Progress loop
  useEffect(() => {
    if (!story) return;
    let raf: number;
    const tick = () => {
      if (!paused) {
        const elapsed = elapsedBefore.current + (Date.now() - startedAt.current);
        const p = Math.min(1, elapsed / STORY_DURATION_MS);
        setProgress(p);
        if (p >= 1) {
          advance();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx, paused, story?.id]);

  // Pause handling
  useEffect(() => {
    if (paused) {
      elapsedBefore.current += Date.now() - startedAt.current;
    } else {
      startedAt.current = Date.now();
    }
  }, [paused]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") rewind();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx]);

  if (!group || !story) return null;

  const advance = () => {
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
    } else {
      onClose();
    }
  };

  const rewind = () => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((i) => i - 1);
    } else {
      // restart current
      startedAt.current = Date.now();
      elapsedBefore.current = 0;
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!user || story.user_id !== user.id) return;
    const { error } = await supabase.from("stories").delete().eq("id", story.id);
    if (error) {
      toast.error("Couldn't delete story");
      return;
    }
    toast.success("Story deleted");
    advance();
  };

  const isOwn = user?.id === story.user_id;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in-up"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-black flex flex-col">
        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 flex gap-1">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress * 100}%` : "0%",
                  transition: i === storyIdx ? "none" : "width 0.1s linear",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 inset-x-0 z-30 flex items-center justify-between px-4 pt-3 text-white">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border border-white/30">
              <AvatarImage src={group.avatar_url ?? undefined} alt={group.username} />
              <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                {group.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-tight">{group.username}</p>
              <p className="text-xs text-white/70">{timeAgoShort(story.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isOwn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-white hover:bg-white/10 hover:text-white"
                aria-label="Delete story"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <img
          src={story.image_url}
          alt={`Story by ${group.username}`}
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Tap zones */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            rewind();
          }}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
          aria-label="Previous"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
          aria-label="Next"
        />

        {/* Desktop arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            rewind();
          }}
          className={cn(
            "hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white",
          )}
          aria-label="Previous story"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white"
          aria-label="Next story"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};