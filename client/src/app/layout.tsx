// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommonLayout from "@/components/common/layout";
import AuthProvider from "@/components/layout/AuthProvider";

export const metadata: Metadata = {
  title: "Your E-Commerce App",
  description: "Modern e-commerce platform",
};

// This runs on server to prevent flash of wrong theme
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {
              document.documentElement.setAttribute('data-theme', 'light');
            }
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <CommonLayout>{children}</CommonLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}