// // app/layout.tsx - UPDATED
// import type { Metadata } from "next";
// import "./globals.css";
// import { Toaster } from "@/components/ui/toaster";
// import CommonLayout from "@/components/common/layout";
// import AuthProvider from "@/components/providers/AuthProvider";
// import { WarmupProvider } from "@/components/providers/warmUpProvider";
// import { CookieDebug } from "@/components/debug/CookieDebug";

// export const metadata: Metadata = {
//   title: "Your E-Commerce App",
//   description: "Modern e-commerce platform",
// };

// // Theme initialization script
// function ThemeScript() {
//   return (
//     <script
//       dangerouslySetInnerHTML={{
//         __html: `
//           (function() {
//             try {
//               var theme = localStorage.getItem('theme') || 'light';
//               document.documentElement.setAttribute('data-theme', theme);
//             } catch (e) {
//               document.documentElement.setAttribute('data-theme', 'light');
//             }
//           })();
//         `,
//       }}
//     />
//   );
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head>
//         <ThemeScript />
//       </head>
//       <body className="antialiased">
//         <WarmupProvider>
//           <AuthProvider>
//             <CommonLayout>{children}</CommonLayout>
//             <CookieDebug />
//           </AuthProvider>
//         </WarmupProvider>
//         <Toaster />
//       </body>
//     </html>
//   );
// }

// app/layout.tsx - CORRECTED
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommonLayout from "@/components/common/layout";
import AuthProvider from "@/components/providers/AuthProvider";
// import { WarmupProvider } from "@/components/providers/warmUpProvider";
import { CookieDebug } from "@/components/debug/CookieDebug";
import ThemeInitializer from "@/components/layout/ThemeInitializer";


export const metadata: Metadata = {
  title: "Futuristic E-Commerce | Next-Gen Shopping",
  description: "Experience the future of shopping with cutting-edge design and lightning-fast performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add futuristic favicon and meta tags */}
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Futuristic font preloads */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ThemeInitializer />
        
        {/* <WarmupProvider> */}
          <AuthProvider>
            <CommonLayout>{children}</CommonLayout>
            <CookieDebug />
          </AuthProvider>
        {/* </WarmupProvider> */}
        <Toaster />
        
        {/* Performance monitoring script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Performance monitoring
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    if (window.performance) {
                      const perfData = window.performance.timing;
                      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                      console.log('🚀 Page loaded in:', loadTime + 'ms');
                    }
                  }, 0);
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}