"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/explore", label: "知识探索" },
  { href: "/research", label: "科研实战" },
  { href: "/tools", label: "生物工具箱" },
  { href: "/cases", label: "产业案例" },
  { href: "/knowledge-map", label: "知识图谱" },
  { href: "/photo-learning", label: "拍照学练" },
  { href: "/seminar", label: "学术研讨" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] liquid-nav grid grid-cols-[1fr_auto_1fr] items-center px-5 md:px-8">
      <Link href="/" className="flex items-center gap-2.5 group justify-self-start" onClick={() => setOpen(false)}>
        <span className="w-9 h-9 rounded-2xl bg-[#111827] flex items-center justify-center shadow-[0_10px_30px_rgba(17,24,39,0.16)] group-hover:scale-105 transition-transform">
          <Dna className="w-4 h-4 text-white" />
        </span>
        <span className="font-display text-[15px] font-extrabold tracking-tight text-[#111827]">
          BioMentor
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-1.5 justify-self-center rounded-full bg-white/35 border border-white/70 px-2 py-1.5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)]"
                  : "text-[#56627a] hover:text-[#111827] hover:bg-white/65"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="justify-self-end">
        <button
          className="md:hidden p-2 rounded-xl hover:bg-white/60 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="打开导航"
        >
          {open ? <X className="w-5 h-5 text-[#111827]" /> : <Menu className="w-5 h-5 text-[#111827]" />}
        </button>
      </div>

      {open && (
        <div className="absolute top-[var(--nav-height)] left-4 right-4 liquid-nav rounded-3xl border border-white/70 md:hidden">
          <div className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all ${
                    isActive ? "bg-[#111827] text-white" : "text-[#56627a] hover:bg-white/60"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
