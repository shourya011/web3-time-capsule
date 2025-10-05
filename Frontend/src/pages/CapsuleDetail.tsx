import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { CosmicButton } from '@/components/CosmicButton';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Clock, Download, FileText, Image, Video, Music, File, Unlock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { timeCapsuleContract, type TimeCapsule } from '@/lib/contract';
import { cryptoService, type RecoveryKit } from '@/lib/crypto';
import { ipfsService } from '@/lib/ipfs';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CapsuleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { toast } = useToast();
  
  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const loadCapsule = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const capsuleData = await timeCapsuleContract.getCapsule(id);
      
      if (!capsuleData) {
        toast({
          title: "Capsule not found",
          description: "The requested time capsule doesn't exist.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setCapsule(capsuleData);
    } catch (error) {
      toast({
        title: "Error loading capsule",
        description: "Failed to load the time capsule data.",
        variant: "destructive",
      });
      console.error('Error loading capsule:', error);
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    loadCapsule();
  }, [id, navigate, loadCapsule]);

  const unlockCapsule = async () => {
    if (!capsule || !address || !id) return;

    try {
      setUnlocking(true);
      
      // Check if user can unlock
      const canUnlock = await timeCapsuleContract.canUnlock(id, address);
      if (!canUnlock) {
        toast({
          title: "Cannot unlock",
          description: "You don't have permission to unlock this capsule or it's not time yet.",
          variant: "destructive",
        });
        return;
      }

      // Prompt user for recovery kit
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const recoveryKit: RecoveryKit = JSON.parse(text);
          
          if (recoveryKit.capsuleId !== id) {
            toast({
              title: "Invalid recovery kit",
              description: "This recovery kit is for a different capsule.",
              variant: "destructive",
            });
            return;
          }

          // Download and decrypt content from IPFS
          const encryptedContent = await ipfsService.download(capsule.contentHash);
          const decryptedContent = await cryptoService.decryptWithRecoveryKit(encryptedContent, recoveryKit);
          
          // Parse the decrypted content
          const contentData = JSON.parse(decryptedContent);
          
          // Create download link
          const blob = new Blob([decryptedContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${capsule.title}-content.json`;
          a.click();
          URL.revokeObjectURL(url);

          toast({
            title: "Capsule unlocked!",
            description: "Your content has been downloaded successfully.",
          });

        } catch (error) {
          toast({
            title: "Failed to unlock",
            description: "Invalid recovery kit or corrupted content.",
            variant: "destructive",
          });
          console.error('Error unlocking capsule:', error);
        }
      };
      input.click();

    } catch (error) {
      toast({
        title: "Error unlocking capsule",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error('Error unlocking capsule:', error);
    } finally {
      setUnlocking(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'images':
        return Image;
      case 'video':
        return Video;
      case 'music':
        return Music;
      case 'text':
        return FileText;
      default:
        return File;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <SpaceBackground />
        <Navigation />
        
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen">
        <SpaceBackground />
        <Navigation />
        
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Capsule Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              The requested time capsule doesn't exist or you don't have access to it.
            </p>
            <CosmicButton onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </CosmicButton>
          </div>
        </div>
      </div>
    );
  }

  const isUnlocked = Date.now() / 1000 >= capsule.unlockTime;
  const canUserUnlock = address && (
    capsule.creator.toLowerCase() === address.toLowerCase() ||
    capsule.recipients.some(recipient => recipient.toLowerCase() === address.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />
      
      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
                {capsule.title}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {capsule.description}
              </p>
            </div>

            {/* Status and Countdown */}
            <Card className="glass-panel cosmic-glow mb-8">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {isUnlocked ? (
                    <>
                      <Unlock className="w-6 h-6 text-green-500" />
                      Capsule Unlocked
                    </>
                  ) : (
                    <>
                      <Clock className="w-6 h-6 text-yellow-500" />
                      Time Remaining
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeLeft ? (
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="text-3xl font-bold">{timeLeft.days}</div>
                      <div className="text-sm text-muted-foreground">Days</div>
                    </div>
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="text-3xl font-bold">{timeLeft.hours}</div>
                      <div className="text-sm text-muted-foreground">Hours</div>
                    </div>
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                      <div className="text-sm text-muted-foreground">Minutes</div>
                    </div>
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                      <div className="text-sm text-muted-foreground">Seconds</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">
                      🎉 Ready to Open!
                    </div>
                    <p className="text-muted-foreground">
                      This time capsule is now available for unlocking.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Capsule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(capsule.createdAt * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unlock Date</span>
                    <span>{new Date(capsule.unlockTime * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-mono text-sm">
                      {`${capsule.creator.slice(0, 6)}...${capsule.creator.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={isUnlocked ? "default" : "secondary"}>
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Content Types</CardTitle>
                  <CardDescription>
                    What's stored in this capsule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {capsule.contentTypes.map((type, index) => {
                      const Icon = getContentIcon(type);
                      return (
                        <div key={index} className="flex items-center gap-2 bg-accent/20 px-3 py-2 rounded-lg">
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unlock Button */}
            {isUnlocked && canUserUnlock && (
              <div className="text-center">
                <CosmicButton
                  glow
                  onClick={unlockCapsule}
                  disabled={unlocking}
                  className="text-lg px-8 py-4"
                >
                  {unlocking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Unlock & Download Content
                    </>
                  )}
                </CosmicButton>
                <p className="text-sm text-muted-foreground mt-4">
                  You'll need to upload your recovery kit to decrypt the content.
                </p>
              </div>
            )}

            {!canUserUnlock && (
              <div className="text-center glass-panel p-8 rounded-xl">
                <p className="text-muted-foreground">
                  You don't have permission to unlock this capsule.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CapsuleDetail;