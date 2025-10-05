import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

interface PublicCapsule {
  id: string;
  title: string;
  creator: string;
  createdDate: string;
  unlockDate: string;
  status: 'locked' | 'unlocked';
  description: string;
  views: number;
  likes: number;
  comments: number;
}

const mockPublicCapsules: PublicCapsule[] = [
  {
    id: '1',
    title: 'Letter to My Future Self',
    creator: '0x742d...4a92',
    createdDate: '2024-01-15',
    unlockDate: '2025-01-15',
    status: 'unlocked',
    description: 'A heartfelt message about my dreams and aspirations for the future.',
    views: 1247,
    likes: 234,
    comments: 45,
  },
  {
    id: '2',
    title: 'Wedding Memories',
    creator: '0x892c...3b81',
    createdDate: '2024-03-20',
    unlockDate: '2029-03-20',
    status: 'locked',
    description: 'Our special day preserved for our 5th anniversary.',
    views: 892,
    likes: 156,
    comments: 28,
  },
  {
    id: '3',
    title: 'Startup Journey',
    creator: '0x123e...7c54',
    createdDate: '2023-06-10',
    unlockDate: '2024-06-10',
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
