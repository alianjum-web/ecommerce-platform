// app/layout.tsx - UPDATED
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommonLayout from "@/components/common/layout";
import AuthProvider from "@/components/layout/AuthProvider";
import { WarmupProvider } from "@/components/providers/warmUpProvider";
import { CookieDebug } from "@/components/debug/CookieDebug";

export const metadata: Metadata = {
  title: "Your E-Commerce App",
  description: "Modern e-commerce platform",
};

// Theme initialization script
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <WarmupProvider>
          <AuthProvider>
            <CommonLayout>{children}</CommonLayout>
            <CookieDebug />
          </AuthProvider>
        </WarmupProvider>
        <Toaster />
      </body>
    </html>
  );
}