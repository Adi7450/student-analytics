import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "DeadlineIQ — Student Analytics",
  description: "Probability of Task Completion Before Deadline & Its Impact on Academic Performance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{
              flex: 1,
              marginLeft: "220px",
              minHeight: "100vh",
              background: "var(--bg-base)",
              padding: "2rem 2.5rem",
              overflowX: "hidden",
            }}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
