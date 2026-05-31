const B = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

export interface SemanticFootprint {
  core_story:        string;
  context:           string;
  emotional_cues:    string[];
  key_entities:      string[];
  full_text:         string;
  image_description: string; // what the vision model saw
}

export interface Story {
  id: string;
  tag: 'Story' | 'Moment' | 'Milestone' | 'Lesson';
  title: string;
  excerpt: string;
  author: string;
  likes: number;
  comments: number;
  image?: string;
  content: string;
  tags: string[];
  createdAt: Date;
  comment?: Comment[];
  semanticFootprint?: SemanticFootprint;
  genLayerTxHash?: string;
  onChainConfirmed?: boolean;
}

export interface Comment {
  id: string;
  storyId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Stats {
  totalStories: number;
  totalCommunityMembers: number;
  totalLikes: number;
  totalComments: number;
}

function norm(obj: any): any {
  if (!obj) return obj;
  if (obj._id && !obj.id) obj.id = obj._id.toString();
  return obj;
}

export function resolveImage(image?: string): string {
  const fallback = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';
  if (!image) return fallback;
  if (image.startsWith('http')) return image;
  return `${B}${image}`;
}

async function safeFetch(url: string, opts?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, opts);
  } catch (err: any) {
    throw new Error(
      `Cannot reach backend at ${B}. Make sure the backend is running on port 3001. (${err.message})`
    );
  }
  return res;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export async function fetchStories(tag?: string | null, search?: string): Promise<Story[]> {
  const p = new URLSearchParams();
  if (tag)    p.append('tag', tag);
  if (search) p.append('search', search);
  const res = await safeFetch(`${B}/api/stories?${p}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch stories (${res.status})`);
  return (await res.json()).map(norm);
}

export async function fetchStoryById(id: string): Promise<Story> {
  const res = await safeFetch(`${B}/api/stories/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch story (${res.status})`);
  return norm(await res.json());
}

export async function createStory(data: {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  tag: string;
  tags: string;
  image?: File;
  semanticFootprint?: SemanticFootprint;
  genLayerTxHash?: string;
}): Promise<Story> {
  const fd = new FormData();
  fd.append('title',   data.title);
  fd.append('excerpt', data.excerpt || data.content.substring(0, 100));
  fd.append('content', data.content);
  fd.append('author',  data.author);
  fd.append('tag',     data.tag);
  fd.append('tags',    data.tags);

  // Only append media if a file actually exists — never append undefined
  if (data.image) fd.append('media', data.image);

  if (data.semanticFootprint) fd.append('semanticFootprint', JSON.stringify(data.semanticFootprint));
  if (data.genLayerTxHash)    fd.append('genLayerTxHash',    data.genLayerTxHash);

  const res = await safeFetch(`${B}/api/stories`, { method: 'POST', body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(e.error || `Failed to create story (${res.status})`);
  }
  return norm(await res.json());
}



export async function fetchRelatedStories(storyId: string): Promise<Story[]> {
  const res = await fetch(`${B}/api/stories/${storyId}/related`);
  if (!res.ok) return [];
  return res.json();
}



export async function markStoryOnChain(id: string, genLayerTxHash: string): Promise<Story> {
  const res = await safeFetch(`${B}/api/stories/${id}/onchain`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ genLayerTxHash }),
  });
  if (!res.ok) throw new Error('Failed to update on-chain status');
  return norm(await res.json());
}

export async function likeStory(id: string): Promise<Story> {
  const res = await safeFetch(`${B}/api/stories/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like story');
  return norm(await res.json());
}

export async function addComment(storyId: string, author: string, content: string): Promise<Comment> {
  const res = await safeFetch(`${B}/api/stories/${storyId}/comments`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ author, content }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return norm(await res.json());
}

export async function fetchStats(): Promise<Stats> {
  const res = await safeFetch(`${B}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ─── Groq Analysis ────────────────────────────────────────────────────────────
// Now sends image as multipart so the backend vision model can actually see it

export async function analyzeMemory(data: {
  title:   string;
  excerpt: string;
  content: string;
  tags:    string[];
  image?:  File;        // ← image file sent directly to backend vision model
}): Promise<SemanticFootprint> {
  const fd = new FormData();
  fd.append('title',   data.title);
  fd.append('excerpt', data.excerpt ?? '');
  fd.append('content', data.content ?? '');
  fd.append('tags',    (data.tags ?? []).join(','));

  // Must be 'media' to match backend's first multer field
  if (data.image) fd.append('media', data.image);

  // DEBUG — remove after confirming it works
  console.log('analyzeMemory FormData:');
  for (const [k, v] of fd.entries()) {
    console.log(' ', k, v instanceof File ? `File(${v.name}, ${v.size}b)` : v);
  }

  const res = await safeFetch(`${B}/api/analyze-memory`, { method: 'POST', body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(e.error || `Analysis failed (${res.status})`);
  }
  const { semanticFootprint } = await res.json();
  return semanticFootprint;
}