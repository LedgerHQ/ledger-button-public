"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "../lib/utils";

interface NavLink {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

const LINKS: NavLink[] = [
  {
    href: "/",
    label: "EVM",
    match: (pathname) => pathname === "/",
  },
  {
    href: "/solana",
    label: "Solana",
    match: (pathname) => pathname.startsWith("/solana"),
  },
];

export function HeaderNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="flex items-center gap-4">
      {LINKS.map((link) => {
        const isActive = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-12 py-6 rounded-lg body-2-semi-bold transition-colors",
              isActive
                ? "bg-muted-transparent text-base border border-active"
                : "text-muted hover:text-base hover:bg-muted-transparent border border-transparent",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
