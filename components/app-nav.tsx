"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";

/** 네비게이션을 숨기는 경로 (홈·로그인 등). */
const HIDDEN_PREFIXES = ["/login", "/logout"];

export function AppNav() {
  const pathname = usePathname();

  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header className="border-b bg-card">
      <nav
        aria-label="주 메뉴"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3"
      >
        <Link href="/pipeline" className="mr-2 font-semibold">
          {APP_NAME}
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <form action="/logout" method="post" className="ml-auto">
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </nav>
    </header>
  );
}
