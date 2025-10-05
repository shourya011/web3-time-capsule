import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { CosmicButton } from '@/components/CosmicButton';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, Plus, Grid, List } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { timeCapsuleContract, type TimeCapsule } from '@/lib/contract';

// Memoized CapsuleCard component to prevent unnecessary re-renders
const CapsuleCard = memo(({ capsule, index, calculateDaysUntil, getDisplayStatus, onNavigate }: {
  capsule: TimeCapsule;
  index: number;
  calculateDaysUntil: (unlockTime: number) => number;
  getDisplayStatus: (unlockTime: number) => string;
  onNavigate: (id: string) => void;
}) => {
  const statusDisplay = getDisplayStatus(capsule.unlockTime);
  const StatusIcon = statusDisplay === 'unlocked' ? Unlock : Lock;

  return (
    <motion.div
      key={capsule.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-panel p-6 rounded-xl cosmic-glow-accent cursor-pointer hover:cosmic-glow transition-all"
      onClick={() => onNavigate(capsule.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-full ${
            statusDisplay === 'unlocked'
              ? 'bg-green-500/20'
              : 'bg-[hsl(var(--status-locked))]/20'
          }`}
        >
          <StatusIcon
            className={`w-6 h-6 ${statusDisplay === 'unlocked' ? 'text-green-500' : 'text-[hsl(var(--status-locked))]'}`}
          />
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            statusDisplay === 'unlocked'
              ? 'bg-green-500/20 text-green-500'
              : 'bg-[hsl(var(--status-locked))]/20 text-[hsl(var(--status-locked))]'
          }`}
        >
          {statusDisplay.toUpperCase()}
        </span>
      </div>

      <h3 className="text-xl font-heading font-bold mb-2">
        {capsule.title}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {capsule.description}
      </p>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Created</span>
          <span>{new Date(capsule.createdAt * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Unlocks</span>
          <span>{new Date(capsule.unlockTime * 1000).toLocaleDateString()}</span>
        </div>
        {statusDisplay === 'locked' && (
          <div className="flex items-center justify-between font-semibold text-primary">
            <span>Days Until Unlock</span>
            <span>{calculateDaysUntil(capsule.unlockTime)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {capsule.contentTypes.map((type) => (
          <span
            key={type}
            className="text-xs px-2 py-1 rounded bg-accent/20 text-accent"
          >
            {type}
          </span>
        ))}
      </div>
    </motion.div>
  );
});

CapsuleCard.displayName = 'CapsuleCard';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const loadUserCapsules = useCallback(async () => {
    if (!address) return;
    
    try {
      const userCapsules = await timeCapsuleContract.getUserCapsules(address);
      setCapsules(userCapsules);
    } catch (error) {
      console.error('Error loading capsules:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserCapsules();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, loadUserCapsules]);

  const calculateDaysUntil = useCallback((unlockTime: number) => {
    const now = Date.now() / 1000;
    const diff = unlockTime - now;
    const days = Math.ceil(diff / (24 * 60 * 60));
    return days > 0 ? days : 0;
  }, []);

  const getDisplayStatus = useCallback((unlockTime: number) => {
    const now = Date.now() / 1000;
    return now >= unlockTime ? 'unlocked' : 'locked';
  }, []);

  // Memoize stats to prevent constant recalculation
  const stats = useMemo(() => {
    const totalCapsules = capsules.length;
    const unlockedCount = capsules.filter((c) => Date.now() / 1000 >= c.unlockTime).length;
    const nextUnlockDays = capsules.length > 0 
      ? calculateDaysUntil(Math.min(...capsules.map(c => c.unlockTime)))
      : 0;
    
    return {
      totalCapsules,
      unlockedCount,
      nextUnlockDays
    };
  }, [capsules, calculateDaysUntil]);

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <SpaceBackground />
        <Navigation />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4 text-gradient">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect your wallet to view your time capsules.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
                My Capsules
              </h1>
              <p className="text-xl text-muted-foreground">
                Manage your time capsules and track their unlock dates
              </p>
            </div>
            <CosmicButton glow onClick={() => navigate('/create')}>
              <Plus className="w-5 h-5 mr-2" />
              Create New
            </CosmicButton>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel p-6 rounded-xl cosmic-glow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Total Capsules</p>
                  <p className="text-3xl font-heading font-bold">{stats.totalCapsules}</p>
                </div>
                <div className="p-4 rounded-full bg-primary/20">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel p-6 rounded-xl cosmic-glow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Next Unlock In</p>
                  <p className="text-3xl font-heading font-bold">
                    {stats.nextUnlockDays} days
                  </p>
                </div>
                <div className="p-4 rounded-full bg-accent/20">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel p-6 rounded-xl cosmic-glow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Unlocked</p>
                  <p className="text-3xl font-heading font-bold">
                    {stats.unlockedCount}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-secondary/20">
                  <Unlock className="w-8 h-8 text-secondary" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* View Toggle */}
          <div className="flex justify-end mb-6">
            <div className="glass-panel p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Capsules Grid/List */}
          {capsules.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-12 rounded-xl cosmic-glow"
              >
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-heading font-bold mb-2">No Time Capsules Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first time capsule to preserve memories for the future.
                </p>
                <CosmicButton glow onClick={() => navigate('/create')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Capsule
                </CosmicButton>
              </motion.div>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {capsules.map((capsule, index) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  index={index}
                  calculateDaysUntil={calculateDaysUntil}
                  getDisplayStatus={getDisplayStatus}
                  onNavigate={(id) => navigate(`/capsule/${id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

Dashboard.displayName = 'Dashboard';

export default memo(Dashboard);