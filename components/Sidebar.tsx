"use client";
import { useState } from "react";
import { LayoutGrid, Tag, Star, Bookmark, User, FileText, ChevronDown, X, Menu, Users } from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Gallery", active: true },
  { icon: Tag, label: "Categories" },
  { icon: Star, label: "Top Stories" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: User, label: "My Stories" },
  { icon: FileText, label: "Drafts" },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="font-display font-bold text-white text-sm leading-none">GenLayer</div>
          <div className="text-purple-400 text-xs font-display">Chronicles</div>
        </div>
        {mobileOpen && (
          <button className="ml-auto text-slate-400" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, active }) => (
          <a key={label} href="#"
            className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body ${active ? "active text-white" : "text-slate-400"}`}
            onClick={() => setMobileOpen(false)}>
            <Icon size={17} />
            {label}
          </a>
        ))}
      </nav>

      {/* Join community card */}
      <div className="p-3">
        <div className="glass rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center mb-3">
            <Users size={16} className="text-purple-400" />
          </div>
          <h4 className="font-display font-semibold text-white text-xs mb-1">Join the community</h4>
          <p className="text-slate-500 text-xs font-body leading-relaxed mb-3">Be part of a growing community sharing real stories and moments.</p>
          <a href="#" className="block text-center text-xs font-display font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 transition-colors">Learn More</a>
        </div>
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <button className="w-full flex items-center gap-3 hover:bg-white/5 rounded-xl px-3 py-2.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-purple-600/50 flex items-center justify-center text-sm font-display text-white flex-shrink-0">A</div>
          <span className="text-sm font-body text-slate-300 flex-1 text-left">Alex R.</span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden bg-[#111118] border border-white/10 rounded-xl p-2 text-white"
        onClick={() => setMobileOpen(true)}>
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-64 h-full bg-[#0F0F18] border-r border-white/5" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden lg:block w-56 flex-shrink-0 bg-[#0F0F18] border-r border-white/5 h-screen sticky top-0">
        {content}
      </aside>
    </>
  );
}