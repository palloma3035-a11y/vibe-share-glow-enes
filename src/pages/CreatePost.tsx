import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

const MAX_MB = 5;

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_MB}MB`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;
    setSubmitting(true);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setSubmitting(false);
      toast.error(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("posts").getPublicUrl(path);

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      image_url: pub.publicUrl,
      caption: caption.trim() || null,
    });

    setSubmitting(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    toast.success("Posted!");
    navigate("/");
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl">Create post</h1>
        <p className="text-muted-foreground mt-1">Share a moment with your followers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
        <div className="space-y-2">
          <Label>Image</Label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden bg-secondary">
              <img src={preview} alt="Preview" className="w-full max-h-[480px] object-contain" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={reset}
                className="absolute top-3 right-3 rounded-full"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-foreground/40 transition-smooth flex flex-col items-center justify-center gap-3 bg-secondary/40"
            >
              <div className="p-4 rounded-2xl gradient-brand">
                <ImagePlus className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {MAX_MB}MB</p>
              </div>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            maxLength={2200}
          />
          <p className="text-xs text-muted-foreground text-right">{caption.length}/2200</p>
        </div>

        <Button
          type="submit"
          disabled={!file || submitting}
          className="w-full gradient-brand text-white border-0 hover:opacity-90"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Share post
        </Button>
      </form>
    </Layout>
  );
};

export default CreatePost;