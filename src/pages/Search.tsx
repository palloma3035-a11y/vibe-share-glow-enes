import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, UserX } from "lucide-react";
import { searchUsers } from "@/lib/follows";

interface ResultUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(q);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl">Discover</h1>
        <p className="text-muted-foreground mt-1">Find people to follow.</p>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="pl-10 h-12 rounded-xl bg-secondary border-transparent focus-visible:bg-background"
        />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        {!query.trim() && (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p>Start typing to find people.</p>
          </div>
        )}

        {query.trim() && loading && results === null && (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p>No users match "{query}".</p>
          </div>
        )}

        {results && results.length > 0 && (
          <ul className="divide-y divide-border">
            {results.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/profile/${u.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/60 transition-smooth"
                >
                  <div className="p-[2px] rounded-full gradient-brand">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarImage src={u.avatar_url ?? undefined} alt={u.username} />
                      <AvatarFallback className="bg-secondary font-semibold">
                        {u.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">@{u.username}</p>
                    <p className="text-xs text-muted-foreground">View profile</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default Search;