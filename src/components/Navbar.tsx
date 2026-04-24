import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusSquare, User, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navItem = (to: string, Icon: typeof Home, label: string) => (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 rounded-xl transition-smooth",
        isActive(to)
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-6 w-6", isActive(to) && "stroke-[2.5]")} />
      <span className="hidden md:inline font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo size="md" />
          {user && (
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 border-r border-border bg-background/60 backdrop-blur-xl flex-col p-5 z-40">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItem("/", Home, "Feed")}
          {navItem("/search", Search, "Search")}
          {navItem("/create", PlusSquare, "Create")}
          {user && navItem(`/profile/${user.id}`, User, "Profile")}
        </nav>
        {user && (
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        )}
      </aside>

      {/* Bottom bar (mobile) */}
      {user && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="flex items-center justify-around px-4 h-16">
            {navItem("/", Home, "Feed")}
            {navItem("/search", Search, "Search")}
            {navItem("/create", PlusSquare, "Create")}
            {navItem(`/profile/${user.id}`, User, "Profile")}
          </div>
        </nav>
      )}
    </>
  );
};