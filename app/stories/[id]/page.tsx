'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, ArrowLeft, Link2, Cpu, Sparkles } from 'lucide-react';
import { fetchStoryById, likeStory, addComment, resolveImage, type Story, type Comment } from '@/lib/api';
import { fetchRelatedStories } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

function RelatedCard({ story }: { story: Story }) {
  return (
    
     <a href={`/stories/${story.id}`}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all block"
    >
      {story.image && (
        <div className="h-28 rounded-lg overflow-hidden mb-3">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20">
          {story.tag}
        </span>
        {story.semanticFootprint?.emotional_cues?.[0] && (
          <span className="text-[10px] text-slate-500">
            {story.semanticFootprint.emotional_cues[0]}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-white line-clamp-2 mb-1">{story.title}</p>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
        {story.semanticFootprint?.core_story || story.excerpt}
      </p>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{story.author}</span>
        <span className="flex items-center gap-1">
          <Heart size={9} /> {story.likes}
        </span>
      </div>
    </a>
  );
}

export default function StoryPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [story,          setStory]          = useState<Story | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [commentAuthor,  setCommentAuthor]  = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [relatedChain,   setRelatedChain]   = useState<Story[]>([]);
  const [chainLoading,   setChainLoading]   = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStoryById(id)
      .then(s => { setStory(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
  if (!story?.id) return;
  setChainLoading(true);
  fetchRelatedStories(story.id)
    .then(setRelatedChain)
    .catch(() => {})
    .finally(() => setChainLoading(false));
}, [story?.id]);

  const handleLike = async () => {
    if (!story) return;
    const updated = await likeStory(story.id).catch(() => null);
    if (updated) setStory(updated);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story || !commentAuthor.trim() || !commentContent.trim()) return;
    setSubmitting(true);
    const comment = await addComment(story.id, commentAuthor, commentContent).catch(() => null);
    if (comment) {
      setStory(prev => prev
        ? { ...prev, comment: [comment, ...(prev.comment ?? [])], comments: prev.comments + 1 }
        : prev);
      setCommentContent('');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex h-screen bg-[#0A0A0F] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
    </div>
  );

  if (!story) return (
    <div className="flex h-screen bg-[#0A0A0F] items-center justify-center text-slate-400">
      Story not found.
    </div>
  );

  return (
    <div className="flex h-screen xl:overflow-hidden bg-[#0A0A0F]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 mt-10">

          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 to-cyan-900 mb-8">
            <img
              src={resolveImage(story.image)} alt={story.title}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop'; }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-400 text-white">{story.tag}</span>
            {story.onChainConfirmed && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                <Link2 size={11} /> Validated On-Chain
              </span>
            )}
            {story.tags?.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400">#{t}</span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">{story.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-8">
            <span className="font-medium text-white">{story.author}</span>
            <span>{new Date(story.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button onClick={handleLike} className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Heart size={14} /> {story.likes}
            </button>
            <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {story.comments}</span>
          </div>

          <div className="mb-12">
            {story.content.split('\n').map((p, i) => (
              <p key={i} className="text-slate-300 leading-relaxed mb-4">{p}</p>
            ))}
          </div>

          {/* Groq Footprint Panel */}
          {story.semanticFootprint?.core_story && (
            <div className="mb-12 bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                <Cpu size={14} /> Groq Semantic Footprint
              </h2>
              <p className="text-slate-300 text-sm italic mb-4">"{story.semanticFootprint.core_story}"</p>
              {story.semanticFootprint.context && (
                <p className="text-xs text-slate-500 mb-4">{story.semanticFootprint.context}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {story.semanticFootprint.emotional_cues?.map(cue => (
                  <span key={cue} className="px-2 py-0.5 rounded-full text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20">{cue}</span>
                ))}
                {story.semanticFootprint.key_entities?.map(ent => (
                  <span key={ent} className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400">{ent}</span>
                ))}
              </div>
              {story.genLayerTxHash && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-600 mb-0.5">GenLayer tx hash</p>
                  <p className="text-xs text-slate-500 font-mono break-all">{story.genLayerTxHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Related On-Chain Memories */}
          <div className="mb-12">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" /> Related Memories — Matched On-Chain
            </h2>
            {chainLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-500" />
                Querying GenLayer contract…
              </div>
            ) : relatedChain.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedChain.map((s) => <RelatedCard key={s.id} story={s} />)}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No related on-chain memories found yet.</p>
            )}
          </div>

          {/* Comments */}
          <div>
            <h2 className="text-lg font-bold text-white mb-6">Comments ({story.comments})</h2>
            <form onSubmit={handleComment} className="mb-8 space-y-3">
              <input
                type="text" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 text-sm"
              />
              <textarea
                value={commentContent} onChange={e => setCommentContent(e.target.value)}
                placeholder="Leave a comment…" rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 resize-none text-sm"
              />
              <button
                type="submit" disabled={submitting}
                className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </form>

            <div className="space-y-4">
              {story.comment?.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{c.author}</span>
                    <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-300">{c.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}