// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommonLayout from "@/components/common/layout";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Your E-Commerce App",
  description: "Modern e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CommonLayout>{children}</CommonLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}