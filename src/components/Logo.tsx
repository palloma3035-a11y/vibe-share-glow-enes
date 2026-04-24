import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 gradient-brand rounded-lg blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative gradient-brand rounded-lg p-1.5">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <span className={`font-display font-extrabold gradient-brand-text ${sizes[size]}`}>
        Glow
      </span>
    </Link>
  );
};