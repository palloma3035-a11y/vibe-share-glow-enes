import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImagePlus, Loader2, X, Sparkles } from "lucide-react";

const MAX_MB = 5;

const CreateStory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    const path = `${user.id}/stories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setSubmitting(false);
      toast.error(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("posts").getPublicUrl(path);

    const { error: insertError } = await supabase.from("stories").insert({
      user_id: user.id,
      image_url: pub.publicUrl,
    });

    setSubmitting(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    toast.success("Story shared! Disappears in 24h.");
    navigate("/");
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 rounded-xl gradient-brand">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl">Add to story</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Disappears after 24 hours.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
        {preview ? (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh]">
            <img src={preview} alt="Story preview" className="w-full h-full object-contain" />
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
            className="w-full aspect-[9/16] max-h-[60vh] rounded-xl border-2 border-dashed border-border hover:border-foreground/40 transition-smooth flex flex-col items-center justify-center gap-3 bg-secondary/40"
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

        <Button
          type="submit"
          disabled={!file || submitting}
          className="w-full gradient-brand text-white border-0 hover:opacity-90"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Share to story
        </Button>
      </form>
    </Layout>
  );
};

export default CreateStory;