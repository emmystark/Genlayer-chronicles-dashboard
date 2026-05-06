const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Story {
  id: string;
  tag: 'Story' | 'Moment' | 'Milestone' | 'Lesson';
  title: string;
  excerpt: string;
  author: string;
  likes: number;
  comments: number;
  image: string;
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

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface Stats {
  totalStories: number;
  totalCommunityMembers: number;
  totalLikes: number;
  totalComments: number;
}

export async function fetchStories(tag?: string | null, search?: string): Promise<Story[]> {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);

  const res = await fetch(`${API_URL}/api/stories?${params}`, {
    next: { revalidate: 10 }
  });
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function fetchStoryById(id: string): Promise<Story> {
  const res = await fetch(`${API_URL}/api/stories/${id}`, {
    next: { revalidate: 10 }
  });
  if (!res.ok) throw new Error('Failed to fetch story');
  return res.json();
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
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('excerpt', data.excerpt);
  formData.append('content', data.content);
  formData.append('author', data.author);
  formData.append('tag', data.tag);
  formData.append('tags', data.tags);
  if (data.image) formData.append('image', data.image);

  const res = await fetch(`${API_URL}/api/stories`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to create story');
  return res.json();
}

export async function likeStory(id: string): Promise<Story> {
  const res = await fetch(`${API_URL}/api/stories/${id}/like`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to like story');
  return res.json();
}

export async function addComment(
  storyId: string,
  author: string,
  content: string
): Promise<Comment> {
  const res = await fetch(`${API_URL}/api/stories/${storyId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, content })
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/stats`, {
    next: { revalidate: 30 }
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}