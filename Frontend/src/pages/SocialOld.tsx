import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock, 
  Shield, 
  Calendar,
  User,
  Filter,
  SortDesc,
  Eye,
  Image,
  FileText,
  Video,
  Music,
  File,
  Search
} from 'lucide-react';
import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { revealService, type RevealedCapsule } from '@/lib/reveal';

const Social: React.FC = () => {
  const [revealedCapsules, setRevealedCapsules] = useState<RevealedCapsule[]>([]);
  const [filteredCapsules, setFilteredCapsules] = useState<RevealedCapsule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'early' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedCapsules, setExpandedCapsules] = useState<Set<string>>(new Set());

  const { address } = useAccount();
  const { toast } = useToast();

  // Load revealed capsules on component mount
  useEffect(() => {
    loadRevealedCapsules();
  }, []);

  // Filter and sort capsules when criteria change
  useEffect(() => {
    let filtered = [...revealedCapsules];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(capsule =>
        capsule.originalData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        capsule.originalData.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'early') {
      filtered = filtered.filter(capsule => capsule.revealMetadata.isEarlyReveal);
    } else if (filterType === 'recent') {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      filtered = filtered.filter(capsule => capsule.revealMetadata.revealedAt > oneDayAgo);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.revealMetadata.revealedAt - a.revealMetadata.revealedAt;
        case 'oldest':
          return a.revealMetadata.revealedAt - b.revealMetadata.revealedAt;
        case 'popular':
          return b.revealMetadata.socialInteractions.likes - a.revealMetadata.socialInteractions.likes;
        default:
          return 0;
      }
    });

    setFilteredCapsules(filtered);
  }, [revealedCapsules, searchTerm, filterType, sortBy]);

  const loadRevealedCapsules = () => {
    const capsules = revealService.getRevealedCapsules();
    setRevealedCapsules(capsules);
  };

  const handleLike = (capsuleId: string) => {
    const success = revealService.likeCapsule(capsuleId);
    if (success) {
      loadRevealedCapsules();
      toast({
        title: "Liked!",
        description: "Your like has been recorded.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to like the capsule.",
        variant: "destructive",
      });
    }
  };

  const handleComment = (capsuleId: string) => {
    const comment = commentInputs[capsuleId]?.trim();
    if (!comment || !address) return;

    const success = revealService.addComment(capsuleId, address, comment);
    if (success) {
      setCommentInputs(prev => ({ ...prev, [capsuleId]: '' }));
      loadRevealedCapsules();
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (capsule: RevealedCapsule) => {
    const url = `${window.location.origin}/social?capsule=${capsule.id}`;
    try {
      await navigator.share({
        title: `Time Capsule: ${capsule.originalData.title}`,
        text: capsule.originalData.description,
        url,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Capsule link copied to clipboard.",
      });
    }
  };

  const toggleExpanded = (capsuleId: string) => {
    setExpandedCapsules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(capsuleId)) {
        newSet.delete(capsuleId);
      } else {
        newSet.add(capsuleId);
      }
      return newSet;
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('text') || type.includes('document')) return FileText;
    return File;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
    status: 'unlocked',
    description: 'The complete story of building our company from scratch.',
    views: 2341,
    likes: 567,
    comments: 89,
  },
  {
    id: '4',
    title: 'Family Time Capsule',
    creator: '0x456f...9d23',
    createdDate: '2024-02-14',
    unlockDate: '2034-02-14',
    status: 'locked',
    description: 'Messages and photos for our children to open in 10 years.',
    views: 453,
    likes: 89,
    comments: 12,
  },
];

const Social = () => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredCapsules =
    filter === 'all'
      ? mockPublicCapsules
      : mockPublicCapsules.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              Social Timeline
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore public time capsules from the community
            </p>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { key: 'all', label: 'All Capsules' },
              { key: 'unlocked', label: 'Recently Unlocked' },
              { key: 'locked', label: 'Locked' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as typeof filter)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  filter === option.key
                    ? 'cosmic-glow bg-primary text-white'
                    : 'glass-panel text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Capsules Feed */}
          <div className="max-w-3xl mx-auto space-y-6">
            {filteredCapsules.map((capsule, index) => (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel p-6 rounded-xl cosmic-glow-accent hover:cosmic-glow transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-heading font-bold">
                      {capsule.creator.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{capsule.creator}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(capsule.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                      capsule.status === 'unlocked'
                        ? 'bg-[hsl(var(--status-unlocked))]/20 text-[hsl(var(--status-unlocked))]'
                        : 'bg-[hsl(var(--status-locked))]/20 text-[hsl(var(--status-locked))]'
                    }`}
                  >
                    {capsule.status === 'unlocked' ? (
                      <Unlock className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {capsule.status.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-heading font-bold mb-2">
                  {capsule.title}
                </h3>
                <p className="text-muted-foreground mb-4">{capsule.description}</p>

                {/* Unlock Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    {capsule.status === 'unlocked' ? 'Unlocked on' : 'Unlocks on'}{' '}
                    {new Date(capsule.unlockDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{capsule.views}</span>
                    </div>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{capsule.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{capsule.comments}</span>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCapsules.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-2">
                No capsules found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Social;
