"use client";

import { usePathname } from "next/navigation";
import Header from "../user/header";
import ThemeToggle from "../layout/Themetoggle";

const pathsNotToShowHeaders = ["/auth", "/super-admin"];

function CommonLayout({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();

  const showHeader = !pathsNotToShowHeaders.some((currentPath) =>
    pathName.startsWith(currentPath)
  );

  return (
    <div className="min-h-screen bg-white">
      <ThemeToggle />
      {showHeader && <Header />}
      <main>{children}</main>
    </div>
  );
}

export default CommonLayout;
