import { Heart, MessageCircle } from "lucide-react";

type Tag = "Story" | "Moment" | "Lesson" | "Milestone";

const tagClass: Record<Tag, string> = {
  Story: "tag-story",
  Moment: "tag-moment",
  Lesson: "tag-lesson",
  Milestone: "tag-milestone",
};

interface StoryCardProps {
  tag: Tag;
  title: string;
  excerpt: string;
  author: string;
  likes: number;
  comments: number;
  img: string;
}

export default function StoryCard({ tag, title, excerpt, author, likes, comments, img }: StoryCardProps) {
  return (
    <div className="bg-[#111118] rounded-2xl overflow-hidden border border-white/5 card-hover cursor-pointer flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118]/90 via-[#111118]/20 to-transparent" />
        <span className={`absolute bottom-3 left-3 text-xs font-display font-medium px-2.5 py-1 rounded-lg ${tagClass[tag]}`}>{tag}</span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-white text-sm leading-snug mb-2">{title}</h3>
        <p className="text-slate-500 text-xs font-body leading-relaxed flex-1">{excerpt}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-700/50 flex items-center justify-center text-[10px] font-display text-white">{author[0]}</div>
            <span className="text-slate-400 text-xs font-body">{author}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="flex items-center gap-1"><Heart size={11} /> {likes}</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} /> {comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}