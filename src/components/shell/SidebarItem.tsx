"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  collapsed: boolean;
}

export default function SidebarItem({ href, icon, label, color, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? "bg-gray-800/80 text-white"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
      }`}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
        style={{
          backgroundColor: isActive ? `${color}20` : "transparent",
          color: isActive ? color : undefined,
        }}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ backgroundColor: color }}
        />
      )}
    </Link>
  );
}
