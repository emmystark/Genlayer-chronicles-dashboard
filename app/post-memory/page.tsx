'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStory, analyzeMemory, type SemanticFootprint } from '@/lib/api';
// import { uploadMemoryOnChain, waitForTx } from '@/lib/genlayer';
import Sidebar from '@/components/Sidebar';
import { CheckCircle, Loader2, AlertCircle, Cpu, Link2, Sparkles, Eye } from 'lucide-react';

const CATEGORIES = [
  { value: 'Story',     label: 'Story',     icon: '📖' },
  { value: 'Moment',    label: 'Moment',    icon: '✨' },
  { value: 'Milestone', label: 'Milestone', icon: '🏆' },
  { value: 'Lesson',    label: 'Lesson',    icon: '💡' },
] as const;

type PipelineStep =
  | 'idle' | 'uploading-media' | 'analyzing'
  | 'submitting-chain' | 'confirming' | 'saving-db' | 'done';

const ORDERED_STEPS: Exclude<PipelineStep, 'idle' | 'done'>[] = [
  'uploading-media', 'analyzing', 'submitting-chain', 'confirming', 'saving-db',
];

const STEP_META: Record<Exclude<PipelineStep, 'idle' | 'done'>, { label: string; description: string }> = {
  'uploading-media':  { label: 'Processing media',    description: 'Reading your image for AI vision analysis…'        },
  'analyzing':        { label: 'Vision + AI analysis', description: 'Vision model describing image, LLaMA building footprint…' },
  'submitting-chain': { label: 'Submitting on-chain', description: 'Sending memory to the GenLayer contract…'          },
  'confirming':       { label: 'Awaiting consensus',  description: 'Validator network classifying your memory…'        },
  'saving-db':        { label: 'Saving to database',  description: 'Persisting your enriched memory to MongoDB…'      },
};

export default function PostMemory() {
  const router = useRouter();

  const [category,     setCategory]     = useState<'Story' | 'Moment' | 'Milestone' | 'Lesson'>('Story');
  const [title,        setTitle]        = useState('');
  const [excerpt,      setExcerpt]      = useState('');
  const [content,      setContent]      = useState('');
  const [author,       setAuthor]       = useState('');
  const [image,        setImage]        = useState<File | null>(null);
  const [tags,         setTags]         = useState('');
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop');

  const [step,      setStep]      = useState<PipelineStep>('idle');
  const [error,     setError]     = useState<string | null>(null);
  const [footprint, setFootprint] = useState<SemanticFootprint | null>(null);
  const [txHash,    setTxHash]    = useState('');

  const loading = step !== 'idle' && step !== 'done';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setFootprint(null);
  setTxHash('');

  if (!title.trim() || !author.trim()) {
    setError('Please fill in at least Title and Author.');
    return;
  }
  if (!content.trim() && !image) {
    setError('Please add a story, an image, or both.');
    return;
  }

  const safeTags = tags.split(',').map(t => t.trim()).filter(Boolean);

  try {
    // Step 1 — media read (UX label only)
    setStep('uploading-media');
    await new Promise(r => setTimeout(r, 300));

    // Step 2 — Vision + Groq analysis (backend call, image goes to vision model)
    setStep('analyzing');
    const fp = await analyzeMemory({
      title,
      excerpt: excerpt || content.substring(0, 100),
      content,
      tags: safeTags,
      image: image ?? undefined,
    });
    setFootprint(fp);

    // Step 3 — skip directly to saving (backend handles GenLayer async)
    setStep('submitting-chain');
    await new Promise(r => setTimeout(r, 400)); // brief UX pause

    // Step 4 — save to MongoDB + fire GenLayer tx in background on backend
    setStep('saving-db');
    const story = await createStory({
      tag: category, title,
      excerpt: excerpt || content.substring(0, 100),
      author, content, tags,
      image: image ?? undefined,
      semanticFootprint: fp,
    });

    // Show the tx hash if backend already got one
    if (story.genLayerTxHash) {
      setTxHash(story.genLayerTxHash);
      setStep('confirming');
      await new Promise(r => setTimeout(r, 600)); // brief UX beat
    }

    setStep('done');
    setTimeout(() => router.push('/'), 1200);

  } catch (err: any) {
    setError(err.message || 'Something went wrong.');
    setStep('idle');
  }
};

  const currentStepIdx = ORDERED_STEPS.indexOf(step as any);

  return (
    <div className="flex h-screen xl:overflow-hidden bg-[#0A0A0F]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mt-20 mx-10 xl:mx-auto pb-20">
          <h1 className="text-3xl font-bold text-white mb-2">Share Your Memory</h1>
          <p className="text-slate-400 mb-8">
            Upload an image and/or text. Groq's vision AI reads the image directly, then GenLayer validators classify it on-chain.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Pipeline progress */}
          {loading && (
            <div className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={13} className="text-purple-400" /> GenLayer Pipeline Running
              </p>
              <div className="space-y-3">
                {ORDERED_STEPS.map((s, i) => {
                  const meta   = STEP_META[s];
                  const isPast = i < currentStepIdx;
                  const isNow  = i === currentStepIdx;
                  return (
                    <div key={s} className={`flex items-center gap-3 text-xs transition-opacity ${isNow ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-25'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isPast ? 'bg-green-500/20 text-green-400' : isNow ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-600'}`}>
                        {isPast ? <CheckCircle size={12} /> : isNow ? <Loader2 size={12} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </span>
                      <span className={isNow ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}>
                        <span className="font-medium">{meta.label}</span>
                        {isNow && <span className="text-slate-500 ml-2">{meta.description}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              {txHash && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-[10px] text-slate-500 mb-0.5">GenLayer tx hash</p>
                  <p className="text-xs text-purple-400 font-mono break-all">{txHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === 'done' && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Memory published and stored on-chain! Redirecting…
            </div>
          )}

          {/* Vision + Groq footprint preview */}
          {footprint && (
            <div className="mb-8 bg-slate-900 border border-purple-500/20 rounded-xl p-5 space-y-3">
              <p className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Cpu size={12} /> Groq Semantic Footprint
              </p>

              {/* Vision description if image was analyzed */}
              {footprint.image_description && (
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Eye size={10} /> Vision model saw:
                  </p>
                  <p className="text-xs text-slate-400 italic">{footprint.image_description}</p>
                </div>
              )}

              <p className="text-xs text-slate-300 italic">"{footprint.core_story}"</p>

              <div className="flex flex-wrap gap-1.5">
                {footprint.emotional_cues.map(e => (
                  <span key={e} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/20">{e}</span>
                ))}
                {footprint.key_entities.map(e => (
                  <span key={e} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">{e}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(({ value, label, icon }) => (
                    <button key={value} type="button" disabled={loading} onClick={() => setCategory(value)}
                      className={`p-4 rounded-lg border transition-all text-center disabled:opacity-50 ${category === value ? 'bg-gray-400 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <div className="text-lg mb-1">{icon}</div>
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Your Name *</label>
                <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                  placeholder="Enter your name" disabled={loading}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 disabled:opacity-50" />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Title *</label>
                <input type="text" value={title} maxLength={100} disabled={loading}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Give your memory a title"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 disabled:opacity-50" />
                <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
              </div>

              {/* Image — shown first so vision model context is clear */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Image / Media
                  <span className="ml-2 text-xs font-normal text-purple-400">← Vision AI reads this directly</span>
                </label>
                <input type="file" accept="image/*" disabled={loading} onChange={handleImageChange}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-500 file:text-white hover:file:opacity-80 disabled:opacity-50" />
                {image && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Eye size={11} /> {image.name} — will be analyzed by Groq vision model
                  </p>
                )}
              </div>

              {/* Story */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Your Story
                  <span className="ml-2 text-xs font-normal text-slate-500">(optional if image uploaded)</span>
                </label>
                <textarea value={content} maxLength={5000} disabled={loading}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Add context to your image, or tell a text-only story…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 resize-none h-36 disabled:opacity-50" />
                <p className="text-xs text-slate-500 mt-1">{content.length}/5000</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tags (optional)</label>
                <input type="text" value={tags} disabled={loading} onChange={e => setTags(e.target.value)}
                  placeholder="e.g. growth, community, learning"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 disabled:opacity-50" />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  : <><Sparkles size={16} /> Publish &amp; Validate On-Chain</>}
              </button>

              {!loading && (
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Vision AI reads your image → Groq builds semantic footprint → GenLayer validates on-chain
                </p>
              )}
            </form>

            {/* Preview */}
            <div className="sticky top-24 h-fit space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="h-64 overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-400 text-white">{category}</span>
                    {txHash && (
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <Link2 size={10} /> On-Chain
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{title || 'Your title here'}</h3>
                  <p className="text-sm text-slate-400 mb-4">{content.substring(0, 100) || 'Your story will appear here'}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{author || 'Your name'}</p>
                      <p className="text-xs text-slate-400">Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-purple-400" /> How the pipeline works
                </p>
                <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside">
                  <li>Image sent to <span className="text-purple-300">Groq vision model</span> (llama-4-scout)</li>
                  <li>Vision output + text → <span className="text-purple-300">LLaMA-3.3-70b</span> builds semantic footprint</li>
                  <li>Footprint submitted to <span className="text-cyan-300">GenLayer contract</span></li>
                  <li>Validators classify emotion &amp; themes on-chain</li>
                  <li>Enriched memory saved to MongoDB + Cloudinary</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}