'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStory } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

const CATEGORIES = [
  { value: 'Story', label: 'Story', icon: '📖' },
  { value: 'Moment', label: 'Moment', icon: '⏱️' },
  { value: 'Milestone', label: 'Milestone', icon: '🎯' },
  { value: 'Lesson', label: 'Lesson', icon: '💡' }
] as const;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function PostMemory() {
  const router = useRouter();
  const [category, setCategory] = useState<'Story' | 'Moment' | 'Milestone' | 'Lesson'>('Story');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createStory({
        tag: category,
        title,
        excerpt: excerpt || content.substring(0, 100),
        author,
        content,
        tags: tags ? tags.split(',').map((t) => t.trim()).join(',') : '',
        image: image ? await toBase64(image) : undefined
      });
      router.push('/');
    } catch (error) {
      alert('Failed to post story');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen xl:overflow-hidden bg-[#0A0A0F]">
        
        <Sidebar/>
      <div className="max-w-6xl mt-20 mx-10 xl:mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Share Your Memory</h1>
        <p className="text-slate-400 mb-8">Tell your story and inspire our community.</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`p-4 rounded-lg border transition-all text-center ${
                      category === value
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-slate-700 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Your Name *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!excerpt) setExcerpt(e.target.value);
                }}
                placeholder="Give your memory a compelling title"
                maxLength={100}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
            </div>

            {/* Story */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Your Story *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your story in detail..."
                maxLength={5000}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors resize-none h-48"
              />
              <p className="text-xs text-slate-500 mt-1">{content.length}/5000</p>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-cyan-600 file:text-white hover:file:opacity-80"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Tags (optional)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. #growth, #community, #learning"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Up to 5 tags, separated by commas</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Memory'}
            </button>
          </form>

          {/* Preview */}
          <div className="sticky top-24 h-fit">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-purple-900 to-cyan-900 overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
                    {category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{title || 'Your title here'}</h3>
                <p className="text-sm text-slate-400 mb-4">{excerpt || 'Your excerpt will appear here'}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600" />
                  <div>
                    <p className="text-sm font-medium text-white">{author || 'Your name'}</p>
                    <p className="text-xs text-slate-400">Just now</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-3">💡 Tips for a great memory</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Be authentic and write from the heart</li>
                <li>• Add specific details that bring your story to life</li>
                <li>• Share what you learned or how you grew</li>
                <li>• Include photos to make it more powerful</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}