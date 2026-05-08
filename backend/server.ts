import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose, { Schema, model } from 'mongoose';

dotenv.config();

const app: Express = express();

// CORS — must be first middleware
app.use((req: any, res: any, next: any) => {
  const allowed = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const origin = req.headers.origin;
  if (!origin || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chronicles';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Schemas
const storySchema = new Schema({
  tag: { type: String, enum: ['Story', 'Moment', 'Milestone', 'Lesson'], default: 'Story' },
  title: { type: String, required: true },
  excerpt: String,
  author: { type: String, required: true },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  image: String,
  content: { type: String, required: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new Schema({
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  author: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const StoryModel = model('Story', storySchema);
const CommentModel = model('Comment', commentSchema);

// File uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
});

app.use('/uploads', express.static(uploadsDir));

function norm(doc: any) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = o._id.toString();
  return o;
}

app.get('/health', (_req, res) => res.json({ ok: true, port: process.env.PORT || 3001 }));

app.get('/api/stories', async (req: Request, res: Response) => {
  try {
    const { tag, search } = req.query;
    const query: any = {};
    if (tag && tag !== 'All') query.tag = tag;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } }
    ];
    const stories = await StoryModel.find(query).sort({ createdAt: -1 });
    res.json(stories.map(norm));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

app.get('/api/stories/:id', async (req: Request, res: Response) => {
  try {
    const story = await StoryModel.findById(req.params.id);
    if (!story) { res.status(404).json({ error: 'Not found' }); return; }
    const comments = await CommentModel.find({ storyId: req.params.id }).sort({ createdAt: -1 });
    const obj = norm(story);
    obj.comment = comments.map(norm);
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

app.post('/api/stories', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { title, excerpt, content, author, tag, tags } = req.body;
    if (!title || !content || !author) {
      res.status(400).json({ error: 'title, content and author are required' });
      return;
    }
    const safeTags = typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];
    const story = await new StoryModel({
      tag: tag || 'Story', title, author, content,
      excerpt: excerpt || content.substring(0, 100),
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
      tags: safeTags
    }).save();
    console.log('✅ Story saved:', story._id);
    res.status(201).json(norm(story));
  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ error: 'Failed to save story' });
  }
});

app.post('/api/stories/:id/like', async (req: Request, res: Response) => {
  try {
    const story = await StoryModel.findByIdAndUpdate(
      req.params.id, { $inc: { likes: 1 } }, { new: true }
    );
    if (!story) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(norm(story));
  } catch (err) {
    res.status(500).json({ error: 'Failed to like story' });
  }
});

app.get('/api/stories/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await CommentModel.find({ storyId: req.params.id }).sort({ createdAt: -1 });
    res.json(comments.map(norm));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/stories/:id/comments', async (req: Request, res: Response) => {
  try {
    const { author, content } = req.body;
    if (!author || !content) {
      res.status(400).json({ error: 'author and content required' });
      return;
    }
    const comment = await new CommentModel({ storyId: req.params.id, author, content }).save();
    await StoryModel.findByIdAndUpdate(req.params.id, { $inc: { comments: 1 } });
    res.status(201).json(norm(comment));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const totalStories = await StoryModel.countDocuments();
    const agg = await StoryModel.aggregate([{ $group: { _id: null, totalLikes: { $sum: '$likes' } } }]);
    res.json({
      totalStories,
      totalCommunityMembers: 1,
      totalLikes: agg[0]?.totalLikes || 0,
      totalComments: await CommentModel.countDocuments()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});