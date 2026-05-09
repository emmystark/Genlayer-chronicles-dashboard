'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Clock, Tag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchStoryById, likeStory, addComment, type Story, type Comment } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

const B = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
const FALLBACK = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=600&fit=crop&q=80';

function resolveImage(image?: string): string {
  if (!image) return FALLBACK;
  if (image.startsWith('http')) return image;
  return `${B}${image}`;
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const palettes = [
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-green-400 to-emerald-600',
    'from-orange-400 to-red-500',
    'from-violet-500 to-indigo-500',
  ];
  const color = palettes[(name.charCodeAt(0) || 0) % palettes.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}>
      {initials}
    </div>
  );
}

export default function StoryDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const commentsRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [story, setStory]           = useState<Story | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [liked, setLiked]           = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError]     = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStoryById(id);
        setStory(data);
        setComments(data.comment || []);
      } catch (err) {
        console.error('Failed to fetch story:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!liked && story) {
      try {
        await likeStory(story.id);
        setLiked(true);
        setStory(s => s ? { ...s, likes: s.likes + 1 } : s);
      } catch (e) { console.error(e); }
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => nameRef.current?.focus(), 400);
  };

  const handleComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim() || !authorName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(id, authorName, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A0F]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading story…</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex h-screen bg-[#0A0A0F]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white text-xl font-bold">Story not found</p>
          <button onClick={() => router.push('/')} className="text-purple-400 text-sm hover:text-purple-300 transition-colors">
            ← Back to gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">

        {/* ── Hero ── */}
        <div className="relative w-full bg-gradient-to-br from-purple-950 to-slate-900">
          {/* Fixed 16:9-ish aspect ratio that collapses gracefully on mobile */}
          <div className="w-full" style={{ paddingBottom: 'min(56.25%, 420px)' }}>
            <img
              src={imgError ? FALLBACK : resolveImage(story.image)}
              alt={story.title}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient overlay  darkens bottom so text is always readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/30 to-transparent pointer-events-none" />
          </div>

          {/* Back button  always visible, top-left corner */}
          <button
            onClick={() => router.back()}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/80 transition-all text-xs sm:text-sm"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* ── Body ── pulled up to overlap hero fade */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 pb-24">

          {/* Tag + date */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r bg-gray-400 text-white">
              <Tag size={9} />
              {story.tag}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock size={10} />
              {timeAgo(story.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug mb-5">
            {story.title}
          </h1>

          {/* Author row + action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar name={story.author} size="lg" />
              <div>
                <p className="text-sm font-semibold text-white">{story.author}</p>
                <p className="text-xs text-slate-500">Author</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleLike}
                title={liked ? 'Liked' : 'Like this story'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  liked
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-red-400 hover:border-red-500/30'
                }`}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                {story.likes}
              </button>
              <button
                onClick={scrollToComments}
                title="Go to comments"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700 transition-all"
              >
                <MessageCircle size={14} />
                {comments.length}
              </button>
              <button
                onClick={handleShare}
                title="Copy link"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
                  copied
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Story body */}
          <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap mb-10">
            {story.content}
          </p>

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-8 mb-8 border-b border-slate-800">
              {story.tags.map((t, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* ── Comments ── */}
          <div ref={commentsRef}>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-base font-bold text-white">Comments</h2>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {comments.length}
              </span>
            </div>

            {/* Comment form */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {authorName ? authorName[0].toUpperCase() : '?'}
                </div>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              <div className="relative">
                <textarea
                  placeholder="Write a comment… (⌘+Enter to post)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(); }}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                />
                <button
                  onClick={() => handleComment()}
                  disabled={!commentText.trim() || !authorName.trim() || submitting}
                  className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-gradient-to-r bg-gray-400 flex items-center justify-center text-white disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {submitting
                    ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    : <Send size={12} />
                  }
                </button>
              </div>
            </div>

            {/* Comment list */}
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-2xl gap-2">
                <MessageCircle size={24} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No comments yet  be first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c, i) => (
                  <div key={c.id || i} className="flex gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/70 transition-colors">
                    <Avatar name={c.author || 'A'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-white">{c.author}</span>
                        <span className="text-xs text-slate-600">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed break-words">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}