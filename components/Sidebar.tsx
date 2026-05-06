'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PenSquare, Menu, X } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Gallery' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/post-memory', icon: PenSquare, label: 'Post Memory' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen xl:relative w-64 bg-slate-950 border-r border-slate-800 flex flex-col pt-6 transition-transform duration-300 ease-in-out lg:translate-x-0 z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="px-6 mb-12 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
            G
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">GenLayer</span>
            <span className="text-[10px] text-slate-400">Chronicles</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">© 2024 GenLayer Chronicles</p>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}