"use client";
import { useState } from "react";
import { Search, Moon, Bell, PenSquare, ChevronDown, SlidersHorizontal } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StoryCard from "@/components/StoryCard";

const ALL_STORIES = [
  { id: "1", tag: "Story" as const, title: "The Night That Changed Everything", excerpt: "Sometimes, one moment can change the way you see the world forever.", author: "Alex R.", likes: 128, comments: 24, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop" },
  { id: "2", tag: "Moment" as const, title: "Our First Concert", excerpt: "The energy, the music, the people. Unforgettable.", author: "Maya L.", likes: 98, comments: 16, image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop" },
  { id: "3", tag: "Lesson" as const, title: "Notes from the Past", excerpt: "Old notes, big dreams, and everything in between.", author: "Jordan K.", likes: 76, comments: 12, image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop" },
  { id: "4", tag: "Milestone" as const, title: "Lost in Nature, Found Myself", excerpt: "Sometimes you need to get lost to find yourself.", author: "Chris T.", likes: 112, comments: 18, image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop" },
  { id: "5", tag: "Lesson" as const, title: "Discipline Over Motivation", excerpt: "Motivation fades, but discipline builds the life you want.", author: "Sam W.", likes: 204, comments: 31, image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=600&h=400&fit=crop" },
  { id: "6", tag: "Milestone" as const, title: "Reached the Top", excerpt: "It wasn't just about the view. It was about proving to myself I could do it.", author: "Jamie P.", likes: 189, comments: 27, image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop" },
  { id: "7", tag: "Moment" as const, title: "Captured a Memory", excerpt: "Behind every photo is a story you'll never forget.", author: "Taylor M.", likes: 93, comments: 9, image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600&h=400&fit=crop" },
  { id: "8", tag: "Story" as const, title: "A New Beginning", excerpt: "Every ending is a new beginning in disguise.", author: "Riley S.", likes: 147, comments: 22, image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&h=400&fit=crop" },
];

const TABS = ["All", "Stories", "Moments", "Milestones", "Lessons"] as const;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_STORIES.filter((s) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "Stories" && s.tag === "Story") ||
      (activeTab === "Moments" && s.tag === "Moment") ||
      (activeTab === "Milestones" && s.tag === "Milestone") ||
      (activeTab === "Lessons" && s.tag === "Lesson");
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

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
            <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] text-slate-600 bg-white/5 rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Moon size={15} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
            </button>
            <a href="/post-memory" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-display font-medium px-4 py-2 rounded-xl transition-colors">
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
                    activeTab === tab
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white font-body transition-colors">
                Latest <ChevronDown size={13} />
              </button>
              <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s) => (
                <StoryCard key={s.id} story={s as any} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="font-display text-sm">No stories found</p>
              <p className="font-body text-xs mt-1">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}