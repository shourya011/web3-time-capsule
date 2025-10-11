import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock, 
  Shield, 
  Calendar,
  User,
  SortDesc,
  Eye,
  Image,
  FileText,
  Video,
  Music,
  File,
  Search,
  Trash2
} from 'lucide-react';
import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { revealService, type RevealedCapsule } from '@/lib/reveal';
import { MessageThread } from '@/components/Messaging/MessageThread';
import { PaymentModal } from '@/components/Messaging/PaymentModal';

const Social: React.FC = () => {
  const [revealedCapsules, setRevealedCapsules] = useState<RevealedCapsule[]>([]);
  const [filteredCapsules, setFilteredCapsules] = useState<RevealedCapsule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'early' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedCapsules, setExpandedCapsules] = useState<Set<string>>(new Set());
  const [activeThread, setActiveThread] = useState<{ capsuleId: string; seller: string } | null>(null);
  const [activePayment, setActivePayment] = useState<{ capsuleId: string; seller: string; title?: string } | null>(null);

  const { address } = useAccount();
  const { toast } = useToast();

  // Function to check for automatically unlocked capsules
  const checkForUnlockedCapsules = useCallback(async () => {
    if (!address) return;
    
    try {
      console.log('🕐 Checking for auto-unlocked capsules...');
      
      // Use immediate reveal for faster results
      const immediateRevealedCount = await revealService.immediateRevealAllUnlocked(address);
      
      // Also run the regular checks for good measure
      const userAutoRevealedCount = await revealService.checkAndRevealUnlockedCapsules(address);
      const socialAutoRevealedCount = await revealService.autoRevealUnlockedCapsulesForSocial(address);
      
      // Add fallback: show unlocked capsules even without full decryption
      const pseudoRevealedCount = revealService.addUnlockedCapsulesAsPseudoRevealed(address);
      
      const totalAutoRevealed = immediateRevealedCount + userAutoRevealedCount + socialAutoRevealedCount + pseudoRevealedCount;
      
      // Always refresh the list to show any changes
      const capsules = revealService.getRevealedCapsules();
      setRevealedCapsules(capsules);
      
      if (totalAutoRevealed > 0) {
        toast({
          title: "🎉 Capsules Unlocked!",
          description: `${totalAutoRevealed} time capsule${totalAutoRevealed > 1 ? 's have' : ' has'} reached ${totalAutoRevealed > 1 ? 'their' : 'its'} unlock time and appeared in the social feed!`,
        });
      }
    } catch (error) {
      console.error('Failed to check for unlocked capsules:', error);
    }
  }, [address, toast]);

  // Load revealed capsules on component mount and check for auto-unlocked ones
  useEffect(() => {
    const loadAndCheckCapsules = async () => {
      // First load existing revealed capsules
      const capsules = revealService.getRevealedCapsules();
      setRevealedCapsules(capsules);
      
      // Then immediately check for unlocked capsules if user is connected
      if (address) {
        console.log('🚀 Initial check for unlocked capsules on social page load...');
        await checkForUnlockedCapsules();
      }
    };
    
    loadAndCheckCapsules();
  }, [address, checkForUnlockedCapsules]);

  // Auto-check for unlocked capsules whenever user address changes
  useEffect(() => {
    if (address) {
      checkForUnlockedCapsules();
    }
  }, [address, checkForUnlockedCapsules]);

  // Periodic check for unlocked capsules every 10 seconds
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Periodic check for unlocked capsules...');
      checkForUnlockedCapsules();
    }, 10 * 1000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [address, checkForUnlockedCapsules]);

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

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all revealed capsules from the social feed? This action cannot be undone.')) {
      revealService.clearAllRevealedCapsules();
      loadRevealedCapsules();
      toast({
        title: "Cleared!",
        description: "All revealed capsules have been removed from the social feed.",
        variant: "destructive",
      });
    }
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

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              Social Feed
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover revealed time capsules from the community
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="glass-panel mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search capsules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === 'early' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('early')}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Early Reveals
                  </Button>
                  <Button
                    variant={filterType === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('recent')}
                  >
                    Recent
                  </Button>
                </div>

                {/* Sort */}
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'newest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('newest')}
                  >
                    <SortDesc className="w-4 h-4 mr-1" />
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === 'popular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('popular')}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Popular
                  </Button>
                </div>

                {/* Clear All Button */}
                {revealedCapsules.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAll}
                      className="hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                )}

                {/* Refresh Unlocked Capsules Button */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered...');
                      checkForUnlockedCapsules();
                    }}
                    className="hover:bg-blue-600"
                    disabled={!address}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Check Unlocked
                  </Button>
                  
                  {/* Debug button removed in production */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capsules Feed */}
          <div className="space-y-6">
            {filteredCapsules.length === 0 ? (
              <Card className="glass-panel">
                <CardContent className="py-12 text-center">
                  <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No revealed capsules found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to reveal a time capsule!'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCapsules.map((capsule) => {
                const isExpanded = expandedCapsules.has(capsule.id);
                const hasFiles = capsule.originalData.files && capsule.originalData.files.length > 0;

                return (
                  <motion.div
                    key={capsule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {`${capsule.originalData.creator.slice(0, 6)}...${capsule.originalData.creator.slice(-4)}`}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTimeAgo(capsule.revealMetadata.revealedAt)}</span>
                              {capsule.revealMetadata.isEarlyReveal && (
                                <Badge variant="destructive" className="text-xs">
                                  Early Reveal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(capsule)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveThread({ capsuleId: capsule.id, seller: capsule.originalData.creator || '' })}
                          >
                            Message Seller
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setActivePayment({ 
                              capsuleId: capsule.id, 
                              seller: capsule.originalData.creator || '',
                              title: capsule.originalData.title 
                            })}
                          >
                            💰 Pay Seller
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-heading font-bold mb-2">
                          {capsule.originalData.title}
                        </h3>
                        {capsule.originalData.description && (
                          <p className="text-muted-foreground mb-4">
                            {capsule.originalData.description}
                          </p>
                        )}
                      </div>

                      {/* Files Preview */}
                      {hasFiles && (
                        <div className="mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(capsule.id)}
                            className="mb-3"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {capsule.originalData.files.length} file(s)
                            {isExpanded ? ' - Hide' : ' - Show'}
                          </Button>

                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              {capsule.originalData.files.map((file, index) => {
                                const FileIcon = getFileIcon(file.type);
                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <FileIcon className="w-8 h-8 text-primary" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">{file.type}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          <span>Created {new Date(capsule.originalData.createdAt).toLocaleDateString()}</span>
                        </div>
                        {capsule.revealMetadata.isEarlyReveal && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              Originally locked until {new Date(capsule.revealMetadata.originalUnlockTime * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Interactions */}
                    <div className="p-6 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(capsule.id)}
                            className="flex items-center gap-2"
                          >
                            <Heart className="w-4 h-4" />
                            <span>{capsule.revealMetadata.socialInteractions.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{capsule.revealMetadata.socialInteractions.comments.length}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Comments */}
                      {capsule.revealMetadata.socialInteractions.comments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {capsule.revealMetadata.socialInteractions.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="font-semibold text-sm mb-1">
                                    {`${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
                                  </p>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTimeAgo(comment.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      {address && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={commentInputs[capsule.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({
                              ...prev,
                              [capsule.id]: e.target.value
                            }))}
                            className="resize-none"
                            rows={2}
                          />
                          <Button
                            onClick={() => handleComment(capsule.id)}
                            disabled={!commentInputs[capsule.id]?.trim()}
                            size="sm"
                            className="self-end"
                          >
                            Post
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Message Thread Modal */}
      {activeThread && (
        <MessageThread
          capsuleId={activeThread.capsuleId}
          sellerAddress={activeThread.seller}
          open={true}
          onClose={() => setActiveThread(null)}
        />
      )}

      {/* Payment Modal */}
      {activePayment && (
        <PaymentModal
          open={true}
          onClose={() => setActivePayment(null)}
          sellerAddress={activePayment.seller}
          capsuleTitle={activePayment.title}
          onSuccess={(txHash) => {
            toast({
              title: "Payment Sent!",
              description: `Payment successfully sent to seller. Transaction: ${txHash.slice(0, 8)}...`,
            });
          }}
        />
      )}
    </div>
  );
};

export default Social;