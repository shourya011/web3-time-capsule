import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import RecoveryKitUpload from '@/components/RecoveryKitUpload';
import EarlyRevealModal from '@/components/EarlyRevealModal';
import { type RecoveryKit } from '@/lib/crypto';
import { type RevealedCapsule } from '@/lib/reveal';

const Reveal: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'reveal'>('upload');
  const [validatedKit, setValidatedKit] = useState<RecoveryKit | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  const capsuleId = searchParams.get('capsuleId');
  const originalUnlockTime = parseInt(searchParams.get('unlockTime') || '0');

  // Redirect if not connected or missing required params
  React.useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to reveal a time capsule.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (!capsuleId) {
      toast({
        title: "Missing Information",
        description: "No capsule ID specified for reveal.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
  }, [isConnected, capsuleId, navigate, toast]);

  const handleValidKit = (kit: RecoveryKit) => {
    setValidatedKit(kit);
    setError(null);
    setStep('reveal');
    // Don't automatically open modal - let user click reveal button
  };

  const handleKitError = (error: string) => {
    setError(error);
    setValidatedKit(null);
  };

  const handleRevealComplete = (revealedCapsule: RevealedCapsule) => {
    setShowRevealModal(false);
    
    toast({
      title: "Success!",
      description: "Your time capsule has been revealed and shared to the social feed.",
    });

    // Navigate to social feed
    setTimeout(() => {
      navigate('/social');
    }, 1000);
  };

  const handleModalClose = () => {
    setShowRevealModal(false);
    // Don't reset step - keep the validated kit
  };

  const handleBack = () => {
    if (step === 'reveal') {
      setStep('upload');
      setValidatedKit(null);
      setShowRevealModal(false);
    } else {
      navigate('/dashboard');
    }
  };

  if (!capsuleId) {
    return null; // Will redirect via useEffect
  }

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
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center cosmic-glow">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              Reveal Time Capsule
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Use your recovery kit to decrypt and reveal your time capsule content. 
              Once revealed, it will be shared publicly in the social feed.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step === 'upload' ? 'bg-primary text-white cosmic-glow' : 'bg-accent text-accent-foreground'}`}>
                1
              </div>
              <div className="w-16 h-1 bg-muted">
                <div className={`h-full bg-primary transition-all duration-300 ${step === 'reveal' ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step === 'reveal' ? 'bg-primary text-white cosmic-glow' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-2xl mx-auto">
            {step === 'upload' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="glass-panel">
                  <CardHeader>
                    <CardTitle>Step 1: Upload Recovery Kit</CardTitle>
                    <CardDescription>
                      Upload the JSON recovery kit file that was downloaded when you created this capsule.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Capsule Information</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Capsule ID:</span>
                          <span className="font-mono">{capsuleId}</span>
                        </div>
                        {originalUnlockTime > 0 && (
                          <div className="flex justify-between">
                            <span>Unlock Date:</span>
                            <span>{new Date(originalUnlockTime * 1000).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`font-semibold ${
                            Date.now() < originalUnlockTime * 1000 ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {Date.now() < originalUnlockTime * 1000 ? 'Early Reveal' : 'Ready to Unlock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <RecoveryKitUpload
                  onValidKit={handleValidKit}
                  onError={handleKitError}
                  onCancel={handleBack}
                  capsuleId={capsuleId}
                />
              </motion.div>
            )}

            {step === 'reveal' && validatedKit && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="glass-panel border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-green-500">Step 2: Recovery Kit Validated ✓</CardTitle>
                    <CardDescription>
                      Your recovery kit has been validated. You can now proceed to reveal your capsule.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-500/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Ready to Reveal</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the button below to decrypt your capsule content and share it publicly.
                        This action cannot be undone.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleBack} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        onClick={() => setShowRevealModal(true)} 
                        className="flex-1 cosmic-glow"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Reveal Capsule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Back Button */}
            <div className="mt-8 text-center">
              <Button onClick={handleBack} variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 'upload' ? 'Back to Dashboard' : 'Back to Upload'}
              </Button>
            </div>
          </div>

          {/* Reveal Modal */}
          {showRevealModal && validatedKit && (
            <EarlyRevealModal
              isOpen={showRevealModal}
              onClose={handleModalClose}
              capsuleId={capsuleId}
              originalUnlockTime={originalUnlockTime}
              recoveryKit={validatedKit}
              onRevealComplete={handleRevealComplete}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reveal;