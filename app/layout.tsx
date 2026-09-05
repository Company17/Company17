import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "SiteLayer — construction management",
  description: "Drawing review, change capture and change-order pricing in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
