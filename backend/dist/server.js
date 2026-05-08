"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importStar(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS — must be first middleware
app.use((req, res, next) => {
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
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chronicles';
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));
// Schemas
const storySchema = new mongoose_1.Schema({
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
const commentSchema = new mongoose_1.Schema({
    storyId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Story' },
    author: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
});
const StoryModel = (0, mongoose_1.model)('Story', storySchema);
const CommentModel = (0, mongoose_1.model)('Comment', commentSchema);
// File uploads
const uploadsDir = path_1.default.join(process.cwd(), 'public', 'uploads');
if (!fs_1.default.existsSync(uploadsDir))
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
});
app.use('/uploads', express_1.default.static(uploadsDir));
function norm(doc) {
    const o = doc.toObject ? doc.toObject() : { ...doc };
    o.id = o._id.toString();
    return o;
}
app.get('/health', (_req, res) => res.json({ ok: true, port: process.env.PORT || 3001 }));
app.get('/api/stories', async (req, res) => {
    try {
        const { tag, search } = req.query;
        const query = {};
        if (tag && tag !== 'All')
            query.tag = tag;
        if (search)
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        const stories = await StoryModel.find(query).sort({ createdAt: -1 });
        res.json(stories.map(norm));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});
app.get('/api/stories/:id', async (req, res) => {
    try {
        const story = await StoryModel.findById(req.params.id);
        if (!story) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const comments = await CommentModel.find({ storyId: req.params.id }).sort({ createdAt: -1 });
        const obj = norm(story);
        obj.comment = comments.map(norm);
        res.json(obj);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch story' });
    }
});
app.post('/api/stories', upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, content, author, tag, tags } = req.body;
        if (!title || !content || !author) {
            res.status(400).json({ error: 'title, content and author are required' });
            return;
        }
        const safeTags = typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [];
        const story = await new StoryModel({
            tag: tag || 'Story', title, author, content,
            excerpt: excerpt || content.substring(0, 100),
            image: req.file ? `/uploads/${req.file.filename}` : undefined,
            tags: safeTags
        }).save();
        console.log('✅ Story saved:', story._id);
        res.status(201).json(norm(story));
    }
    catch (err) {
        console.error('❌ Save error:', err);
        res.status(500).json({ error: 'Failed to save story' });
    }
});
app.post('/api/stories/:id/like', async (req, res) => {
    try {
        const story = await StoryModel.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        if (!story) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(norm(story));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to like story' });
    }
});
app.get('/api/stories/:id/comments', async (req, res) => {
    try {
        const comments = await CommentModel.find({ storyId: req.params.id }).sort({ createdAt: -1 });
        res.json(comments.map(norm));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
app.post('/api/stories/:id/comments', async (req, res) => {
    try {
        const { author, content } = req.body;
        if (!author || !content) {
            res.status(400).json({ error: 'author and content required' });
            return;
        }
        const comment = await new CommentModel({ storyId: req.params.id, author, content }).save();
        await StoryModel.findByIdAndUpdate(req.params.id, { $inc: { comments: 1 } });
        res.status(201).json(norm(comment));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
app.get('/api/stats', async (_req, res) => {
    try {
        const totalStories = await StoryModel.countDocuments();
        const agg = await StoryModel.aggregate([{ $group: { _id: null, totalLikes: { $sum: '$likes' } } }]);
        res.json({
            totalStories,
            totalCommunityMembers: 1,
            totalLikes: agg[0]?.totalLikes || 0,
            totalComments: await CommentModel.countDocuments()
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});
