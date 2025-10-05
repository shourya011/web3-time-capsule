import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { CosmicButton } from '@/components/CosmicButton';
import { motion } from 'framer-motion';
import { Search as SearchIcon, User, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface SearchResult {
  id: string;
  username: string;
  walletAddress: string;
  capsuleCount: number;
  publicCapsules: number;
  joinedDate: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    username: 'CryptoExplorer',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f4a92',
    capsuleCount: 12,
    publicCapsules: 5,
    joinedDate: '2023-06-15',
  },
  {
    id: '2',
    username: 'TimeTraveler',
    walletAddress: '0x892c15Aa7634B0532925b3c755Ac8e7595f3b81',
    capsuleCount: 8,
    publicCapsules: 3,
    joinedDate: '2024-01-20',
  },
  {
    id: '3',
    username: 'MemoryKeeper',
    walletAddress: '0x123e45Bb8745C0532925c4d866Bd9f8696e7c54',
    capsuleCount: 15,
    publicCapsules: 7,
    joinedDate: '2023-11-10',
  },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setHasSearched(true);
    // Simulate search - in real app, this would be an API call
    if (searchQuery.trim()) {
      const filtered = mockResults.filter(
        (result) =>
          result.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              Search Users
            </h1>
            <p className="text-xl text-muted-foreground">
              Find people by username or wallet address
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by username or wallet address..."
                  className="pl-12 h-14 text-lg glass-panel border-primary/30 focus:border-primary"
                />
              </div>
              <CosmicButton onClick={handleSearch} size="lg" glow>
                <SearchIcon className="w-5 h-5 mr-2" />
                Search
              </CosmicButton>
            </div>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="max-w-4xl mx-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-heading font-bold mb-6">
                    Found {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'}
                  </h2>
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel p-6 rounded-xl cosmic-glow-accent hover:cosmic-glow transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                          </div>

                          {/* User Info */}
                          <div>
                            <h3 className="text-xl font-heading font-bold mb-1">
                              {result.username}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {result.walletAddress.slice(0, 10)}...
                              {result.walletAddress.slice(-8)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined {new Date(result.joinedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8">
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="w-4 h-4 text-primary" />
                              <span className="text-2xl font-heading font-bold">
                                {result.capsuleCount}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Total Capsules</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Unlock className="w-4 h-4 text-accent" />
                              <span className="text-2xl font-heading font-bold">
                                {result.publicCapsules}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Public</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <SearchIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-2">
                    No users found
                  </h3>
                  <p className="text-muted-foreground">
                    Try searching with a different username or wallet address
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions (shown before search) */}
          {!hasSearched && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-heading font-bold mb-6 text-center">
                Featured Users
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockResults.slice(0, 3).map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel p-6 rounded-xl text-center cosmic-glow-accent hover:cosmic-glow transition-all cursor-pointer"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-heading font-bold mb-2">
                      {result.username}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mb-4">
                      {result.walletAddress.slice(0, 8)}...
                      {result.walletAddress.slice(-6)}
                    </p>
                    <div className="flex justify-center gap-4 text-sm">
                      <div>
                        <span className="font-bold text-primary">
                          {result.capsuleCount}
                        </span>
                        <span className="text-muted-foreground ml-1">capsules</span>
                      </div>
                      <div>
                        <span className="font-bold text-accent">
                          {result.publicCapsules}
                        </span>
                        <span className="text-muted-foreground ml-1">public</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Search;
