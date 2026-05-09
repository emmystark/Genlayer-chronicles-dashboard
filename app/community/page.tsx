'use client';

import React, { useState, useEffect } from 'react';
import { Users, Heart, MessageCircle, BookOpen } from 'lucide-react';
import { fetchStats, type Stats } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br bg-gray-400 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white">{value?.toLocaleString() || ''}</p>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    load();
  }, []);

  return (
    // <div className="flex min-h-screen px-4 sm:px-6 py-6">
    <div className="flex h-screen xl:overflow-hidden bg-[#0A0A0F]">
        
        <Sidebar/>
      {/* Header */}
      <div className="max-w-6xl mx-10 xl:overflow-x-hidden pb-20 mt-20 xl:mx-auto">

      <div className=''>
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
        <p className="text-slate-400">Join a growing movement of storytellers and memory keepers.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats && (
          <>
            <StatCard icon={<BookOpen size={20} className="text-white" />} label="Total Stories" value={stats.totalStories} />
            <StatCard icon={<Users size={20} className="text-white" />} label="Community Members" value={stats.totalCommunityMembers} />
            <StatCard icon={<Heart size={20} className="text-white" />} label="Total Likes" value={stats.totalLikes} />
            <StatCard icon={<MessageCircle size={20} className="text-white" />} label="Comments" value={stats.totalComments} />
          </>
        )}
      </div>

      {/* About section */}
      <div className="max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About GenLayer Chronicles</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            GenLayer Chronicles is a dedicated digital platform for the GenLayer community. It's a space where members share personal stories, moments, and milestones that highlight how GenLayer has impacted their livesthrough learning, creativity, and community connection.
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            This platform celebrates the real experiences and authentic voices of our community. Whether you're sharing a breakthrough moment, a lesson learned, or a milestone achieved, your story matters and contributes to our collective archive of gratitude, growth, and connection.
          </p>
          <p className="text-slate-300 leading-relaxed">We believe in creating a safe, inclusive space where every member can share their voice and inspire others. Together, we're building something truly meaningful.</p>
        </div>
      </div>

      {/* CTA section */}
      <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-slate-800 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Ready to share your story?</h3>
        <p className="text-slate-400 mb-6">Join thousands of community members sharing their most meaningful moments.</p>
        <a
          href="/post-memory"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r bg-gray-400 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all"
        >
          Share Your Memory
        </a>
      </div>
      </div>
      </div>
    </div>
  );
}