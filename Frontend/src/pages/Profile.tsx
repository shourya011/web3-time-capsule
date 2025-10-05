import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { CosmicButton } from '@/components/CosmicButton';
import { motion } from 'framer-motion';
import { User, Edit2, Save, Lock, Unlock, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: 'CryptoExplorer',
    bio: 'Preserving memories for the future, one capsule at a time.',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f4a92',
    joinedDate: '2023-06-15',
    totalCapsules: 12,
    publicCapsules: 5,
    privateCapsules: 7,
  });

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const stats = [
    {
      icon: Lock,
      label: 'Total Capsules',
      value: profile.totalCapsules,
      color: 'text-primary',
    },
    {
      icon: Unlock,
      label: 'Public',
      value: profile.publicCapsules,
      color: 'text-accent',
    },
    {
      icon: Lock,
      label: 'Private',
      value: profile.privateCapsules,
      color: 'text-secondary',
    },
  ];

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
          <div className="text-center mb-8">
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              My Profile
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="glass-panel p-8 rounded-xl cosmic-glow mb-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>

                {/* Basic Info */}
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={profile.username}
                        onChange={(e) =>
                          setProfile({ ...profile, username: e.target.value })
                        }
                        className="text-2xl font-heading font-bold"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-heading font-bold mb-2">
                        {profile.username}
                      </h2>
                      <p className="text-sm text-muted-foreground font-mono mb-2">
                        {profile.walletAddress.slice(0, 10)}...
                        {profile.walletAddress.slice(-8)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined {new Date(profile.joinedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <CosmicButton
                variant={isEditing ? 'primary' : 'outline'}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                glow={isEditing}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </CosmicButton>
            </div>

            {/* Bio */}
            <div>
              <Label className="text-lg font-semibold mb-2 block">Bio</Label>
              {isEditing ? (
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="min-h-24"
                />
              ) : (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-panel p-6 rounded-xl cosmic-glow-accent text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full bg-${stat.color}/20`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-4xl font-heading font-bold mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Settings */}
          <div className="glass-panel p-8 rounded-xl cosmic-glow">
            <h3 className="text-2xl font-heading font-bold mb-6">Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
                <div>
                  <h4 className="font-semibold mb-1">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when capsules unlock
                  </p>
                </div>
                <input type="checkbox" className="w-6 h-6" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
                <div>
                  <h4 className="font-semibold mb-1">Public Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <input type="checkbox" className="w-6 h-6" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
                <div>
                  <h4 className="font-semibold mb-1">Show Stats</h4>
                  <p className="text-sm text-muted-foreground">
                    Display your capsule statistics publicly
                  </p>
                </div>
                <input type="checkbox" className="w-6 h-6" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
