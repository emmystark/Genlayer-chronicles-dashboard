import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

// Types
interface Story {
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
}

interface Comment {
  id: string;
  storyId: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
}

interface Database {
  stories: Story[];
  comments: Comment[];
  users: User[];
}

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Storage setup
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Database
const db: Database = {
  stories: [
    {
      id: '1',
      tag: 'Story',
      title: 'The Night That Changed Everything',
      excerpt: 'Sometimes, one moment can change the way you see the world forever.',
      author: 'Alex R.',
      likes: 128,
      comments: 24,
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
      content: 'Full story content about a transformative night...',
      tags: [],
      createdAt: new Date(Date.now() - 86400000)
    }
  ],
  comments: [],
  users: [
    {
      id: '1',
      username: 'alex-r',
      name: 'Alex R.',
      bio: 'Storyteller',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    }
  ]
};

// Routes
app.get('/api/stories', (req: Request, res: Response) => {
  const { tag, search } = req.query;
  let filtered = db.stories;

  if (tag && tag !== 'All') {
    filtered = filtered.filter(s => s.tag === tag);
  }
  if (search) {
    const searchStr = (search as string).toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(searchStr) ||
      s.excerpt.toLowerCase().includes(searchStr)
    );
  }

  const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

app.get('/api/stories/:id', (req: Request, res: Response) => {
  const story = db.stories.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });

  const comments = db.comments.filter(c => c.storyId === story.id);
  res.json({ ...story, comments });
});

app.post('/api/stories', upload.single('image'), (req: Request, res: Response) => {
  const { title, excerpt, content, author, tag, tags } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Missing required fields' });

  const story: Story = {
    id: String(Date.now()),
    tag: tag || 'Story',
    title,
    excerpt: excerpt || content.substring(0, 100),
    author,
    likes: 0,
    comments: 0,
    image: req.file
      ? `/uploads/${req.file.filename}`
      : 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
    content,
    tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
    createdAt: new Date()
  };

  db.stories.push(story);
  res.status(201).json(story);
});

app.put('/api/stories/:id', (req: Request, res: Response) => {
  const story = db.stories.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });

  Object.assign(story, req.body);
  res.json(story);
});

app.delete('/api/stories/:id', (req: Request, res: Response) => {
  const idx = db.stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Story not found' });

  db.stories.splice(idx, 1);
  db.comments = db.comments.filter(c => c.storyId !== req.params.id);
  res.json({ message: 'Story deleted' });
});

app.post('/api/stories/:id/like', (req: Request, res: Response) => {
  const story = db.stories.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  story.likes = (story.likes || 0) + 1;
  res.json(story);
});

app.post('/api/stories/:id/comments', (req: Request, res: Response) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'Missing required fields' });

  const comment: Comment = {
    id: String(Date.now()),
    storyId: req.params.id,
    author,
    content,
    createdAt: new Date()
  };

  db.comments.push(comment);
  const story = db.stories.find(s => s.id === req.params.id);
  if (story) story.comments = (story.comments || 0) + 1;

  res.status(201).json(comment);
});

app.get('/api/stories/:id/comments', (req: Request, res: Response) => {
  const comments = db.comments.filter(c => c.storyId === req.params.id);
  res.json(comments);
});

app.get('/api/users/:username', (req: Request, res: Response) => {
  const user = db.users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const stories = db.stories.filter(s => s.author === user.name);
  res.json({ ...user, stories });
});

app.post('/api/users', (req: Request, res: Response) => {
  const { username, name, bio } = req.body;
  if (!username || !name) return res.status(400).json({ error: 'Missing required fields' });

  const user: User = {
    id: String(Date.now()),
    username,
    name,
    bio: bio || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
  };

  db.users.push(user);
  res.status(201).json(user);
});

app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    totalStories: db.stories.length,
    totalCommunityMembers: db.users.length,
    totalLikes: db.stories.reduce((sum, s) => sum + (s.likes || 0), 0),
    totalComments: db.comments.length
  });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});