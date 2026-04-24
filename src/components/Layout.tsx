import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
};