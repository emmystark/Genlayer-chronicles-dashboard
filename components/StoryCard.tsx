'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { type Story, resolveImage } from '@/lib/api';

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link href={`/stories/${story.id}`}>
      <div className="group cursor-pointer h-full">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-300 h-full flex flex-col">
          <div className="h-40 overflow-hidden bg-gradient-to-br from-purple-900 to-cyan-900">
            <img
              src={resolveImage(story.image)}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';
              }}
            />
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
                {story.tag}
              </span>
            </div>
            <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all">
              {story.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">{story.excerpt}</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-400">{story.author}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Heart size={12} />{story.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} />{story.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}