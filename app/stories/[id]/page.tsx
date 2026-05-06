'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchStoryById, likeStory, addComment, type Story, type Comment } from '@/lib/api';

export default function StoryDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStoryById(id);
        setStory(data);
        setComments(data.comment || []);
      } catch (error) {
        console.error('Failed to fetch story:', error);
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
        setStory({ ...story, likes: story.likes + 1 });
      } catch (error) {
        console.error('Failed to like story:', error);
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !authorName.trim()) return;

    try {
      const newComment = await addComment(id, authorName, commentText);
      setComments([...comments, newComment]);
      setCommentText('');
      setAuthorName('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="px-6 py-6">
        <p className="text-slate-400">Story not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-sm">Back</span>
      </button>

      <div className="max-w-2xl mx-auto">
        {/* Story image */}
        <div className="mb-8 rounded-xl overflow-hidden h-96 bg-gradient-to-br from-purple-900 to-cyan-900">
          {story.image && <img src={story.image} alt={story.title} className="w-full h-full object-cover" />}
        </div>

        {/* Story content */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
              {story.tag}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{story.title}</h1>

          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600" />
              <div>
                <p className="text-sm font-medium text-white">{story.author}</p>
                <p className="text-xs text-slate-400">{new Date(story.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{story.content}</p>
          </div>

          {/* Interactions */}
          <div className="flex items-center gap-4 py-6 border-y border-slate-800">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                liked
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-sm">{story.likes}</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <MessageCircle size={16} />
              <span className="text-sm">{comments.length}</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-auto">
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>

        {/* Comments section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Comments ({comments.length})</h2>

          {/* Add comment form */}
          <form onSubmit={handleComment} className="mb-8 pb-8 border-b border-slate-800">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 mb-3"
              />
              <textarea
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 resize-none h-24"
              />
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || !authorName.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </form>

          {/* Comments list */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="pb-6 border-b border-slate-800 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{comment.author}</p>
                    <p className="text-xs text-slate-400 mb-2">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-300">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}