"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Moon, Bell, PenSquare, ChevronDown, SlidersHorizontal } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StoryCard from "@/components/StoryCard";
import { fetchStories, type Story } from "@/lib/api";

const TABS = ["All", "Stories", "Moments", "Milestones", "Lessons"] as const;

// Map tab label → API tag value
const TAB_TO_TAG: Record<string, string | null> = {
  All: null,
  Stories: "Story",
  Moments: "Moment",
  Milestones: "Milestone",
  Lessons: "Lesson",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tag = TAB_TO_TAG[activeTab];
      const data = await fetchStories(tag, search || undefined);
      setStories(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load stories. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  // Debounce search so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStories();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadStories]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F]">
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col xl:mt-20 xl:mx-10 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0A0A0F] flex-shrink-0">
          <div className="flex-1 relative max-w-sm ml-8 lg:ml-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stories..."
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 font-body focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {/* <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] text-slate-600 bg-white/5 rounded px-1.5 py-0.5">
              ⌘K
            </kbd> */}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Moon size={15} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
            </button> */}
            <a
              href="/post-memory"
              className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-display font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <PenSquare size={14} />
              <span className="hidden sm:inline">Post Memory</span>
            </a>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {/* Page heading */}
          <div className="mb-6">
            <h1 className="font-display font-bold text-xl text-white">Stories from the community</h1>
            <p className="text-slate-500 text-sm font-body mt-1">Real stories. Real people. Real impact.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-display font-medium transition-all ${
                    activeTab === tab ? "bg-gray-400 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white font-body transition-colors">
                Latest <ChevronDown size={13} />
              </button>
              <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <SlidersHorizontal size={14} />
              </button>
            </div> */}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <p className="font-display text-sm text-red-400">{error}</p>
            </div>
          ) : stories.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="font-display text-sm">No stories found</p>
              <p className="font-body text-xs mt-1">Be the first to share a memory!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}