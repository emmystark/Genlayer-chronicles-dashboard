// All requests go direct to Express backend.
// NEXT_PUBLIC_BACKEND_URL must be set in .env.local (project root).

const B = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

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

export async function fetchStories(tag?: string | null, search?: string): Promise<Story[]> {
  const p = new URLSearchParams();
  if (tag) p.append('tag', tag);
  if (search) p.append('search', search);
  const res = await fetch(`${B}/api/stories?${p}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stories');
  return (await res.json()).map(norm);
}

export async function fetchStoryById(id: string): Promise<Story> {
  const res = await fetch(`${B}/api/stories/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch story');
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
}): Promise<Story> {
  const fd = new FormData();
  fd.append('title', data.title);
  fd.append('excerpt', data.excerpt || data.content.substring(0, 100));
  fd.append('content', data.content);
  fd.append('author', data.author);
  fd.append('tag', data.tag);
  fd.append('tags', data.tags);
  if (data.image) fd.append('image', data.image);

  const res = await fetch(`${B}/api/stories`, { method: 'POST', body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(e.error || 'Failed to create story');
  }
  return norm(await res.json());
}

export async function likeStory(id: string): Promise<Story> {
  const res = await fetch(`${B}/api/stories/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like story');
  return norm(await res.json());
}

export async function addComment(storyId: string, author: string, content: string): Promise<Comment> {
  const res = await fetch(`${B}/api/stories/${storyId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, content }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return norm(await res.json());
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${B}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}