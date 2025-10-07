import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Users, 
  FileText, 
  Image,
  Video,
  Music,
  File,
  Loader,
  CheckCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { revealService, type RevealedCapsule } from '@/lib/reveal';
import { type RecoveryKit, type DecryptedCapsuleContent } from '@/lib/crypto';

interface EarlyRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleId: string;
  originalUnlockTime: number;
  recoveryKit: RecoveryKit;
  onRevealComplete: (revealedCapsule: RevealedCapsule) => void;
}

export const EarlyRevealModal: React.FC<EarlyRevealModalProps> = ({
  isOpen,
  onClose,
  capsuleId,
  originalUnlockTime,
  recoveryKit,
  onRevealComplete,
}) => {
  const isEarlyReveal = Date.now() < originalUnlockTime * 1000;
  const [step, setStep] = useState<'reason' | 'preview' | 'confirm' | 'revealing' | 'complete'>(
    isEarlyReveal ? 'reason' : 'preview'
  );
  const [decryptedContent, setDecryptedContent] = useState<DecryptedCapsuleContent | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<Array<{
    name: string;
    type: string;
    blob: Blob;
    url: string;
  }>>([]);
  const [revealMessage, setRevealMessage] = useState('');
  const [earlyRevealReason, setEarlyRevealReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [revealedCapsule, setRevealedCapsule] = useState<RevealedCapsule | null>(null);

  const { address } = useAccount();
  const { toast } = useToast();

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setDecryptedContent(null);
      setDecryptedFiles([]);
      setRevealMessage('');
      setEarlyRevealReason('');
      setError(null);
      setRevealedCapsule(null);
    }
  }, [isOpen]);

  const decryptContent = useCallback(async () => {
    try {
      setError(null);
      
      // Use the preview service to decrypt content (bypasses "already revealed" check)
      const result = await revealService.previewCapsule(
        capsuleId,
        recoveryKit,
        address || '',
        originalUnlockTime
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to decrypt content');
      }

      setDecryptedContent(result.data.originalData);

      // Decrypt files if any
      const files = await revealService.decryptCapsuleFiles(result.data);
      setDecryptedFiles(files);

    } catch (error) {
      console.error('Failed to decrypt content:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [capsuleId, recoveryKit, address, originalUnlockTime]);

  // Decrypt content when we reach preview step
  useEffect(() => {
    if (step === 'preview' && !decryptedContent) {
      decryptContent();
    }
  }, [step, decryptedContent, decryptContent]);

  const handleReveal = async () => {
    if (!address || !decryptedContent) {
      toast({
        title: "Error",
        description: "Missing required data for reveal",
        variant: "destructive",
      });
      return;
    }

    try {
      setStep('revealing');
      setError(null);

      // Combine reveal message with early reveal reason if applicable
      let finalRevealMessage = revealMessage.trim();
      if (isEarlyReveal && earlyRevealReason.trim()) {
        finalRevealMessage = finalRevealMessage 
          ? `${earlyRevealReason.trim()}\n\n${finalRevealMessage}`
          : earlyRevealReason.trim();
      }

      const result = await revealService.revealCapsule(
        capsuleId,
        recoveryKit,
        address,
        originalUnlockTime,
        finalRevealMessage || undefined
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to reveal capsule');
      }

      setRevealedCapsule(result.data);
      setStep('complete');

      toast({
        title: "Capsule Revealed!",
        description: "Your time capsule has been revealed and shared to the social feed.",
      });

      onRevealComplete(result.data);
    } catch (error) {
      console.error('Failed to reveal capsule:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStep('confirm');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('text') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-auto glass-panel rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-heading font-bold">
                  {step === 'complete' ? 'Capsule Revealed!' : 'Reveal Time Capsule'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEarlyReveal ? 'Early reveal before unlock time' : 'Reveal at scheduled time'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-6 pb-0">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            
            {step === 'reason' && isEarlyReveal && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Early Reveal Request
                      </CardTitle>
                      <CardDescription>
                        This capsule is scheduled to unlock on {new Date(originalUnlockTime * 1000).toLocaleDateString()}. 
                        Tell us why you want to reveal it early.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert variant="destructive">
                        <Clock className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Warning:</strong> Early reveals cannot be undone. Once revealed, 
                          your capsule will be publicly visible before its scheduled time.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="early-reveal-reason">Why do you want to reveal this capsule early? *</Label>
                        <Textarea
                          id="early-reveal-reason"
                          value={earlyRevealReason}
                          onChange={(e) => setEarlyRevealReason(e.target.value)}
                          placeholder="Please explain your reason for early reveal (e.g., special occasion, changed circumstances, etc.)"
                          className="mt-2"
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {earlyRevealReason.length}/500 characters
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Scheduled unlock information:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Original unlock date:</span>
                            <span className="font-semibold">{new Date(originalUnlockTime * 1000).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Days remaining:</span>
                            <span className="font-semibold text-orange-500">
                              {Math.ceil((originalUnlockTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setStep('preview')}
                      disabled={!earlyRevealReason.trim()}
                      className="cosmic-glow"
                    >
                      Continue to Preview
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {!decryptedContent ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 animate-spin text-primary mx-auto mb-4">⏳</div>
                    <h3 className="text-lg font-semibold mb-2">Decrypting Content...</h3>
                    <p className="text-muted-foreground">
                      Please wait while we decrypt your capsule content
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Warning for early reveal */}
                    {isEarlyReveal && (
                      <Alert variant="destructive">
                        <Clock className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Early Reveal Warning:</strong> This capsule is not yet due to unlock 
                          (scheduled for {new Date(originalUnlockTime * 1000).toLocaleDateString()}). 
                          Revealing it early will make it public immediately.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Content Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Content Preview
                        </CardTitle>
                        <CardDescription>
                          Review your capsule content before revealing
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Title</Label>
                          <p className="text-lg font-medium mt-1">{decryptedContent.title}</p>
                        </div>

                        {decryptedContent.description && (
                          <div>
                            <Label className="text-sm font-semibold">Description</Label>
                            <p className="mt-1 text-muted-foreground">{decryptedContent.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-sm font-semibold">Created</Label>
                            <p className="mt-1">{new Date(decryptedContent.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold">Creator</Label>
                            <p className="mt-1 font-mono text-xs">
                              {`${decryptedContent.creator.slice(0, 6)}...${decryptedContent.creator.slice(-4)}`}
                            </p>
                          </div>
                        </div>

                        {decryptedFiles.length > 0 && (
                          <div>
                            <Label className="text-sm font-semibold mb-3 block">
                              Files ({decryptedFiles.length})
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {decryptedFiles.map((file, index) => {
                                const FileIcon = getFileIcon(file.type);
                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    {file.type.startsWith('image/') ? (
                                      <img 
                                        src={file.url} 
                                        alt={file.name}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    ) : (
                                      <FileIcon className="w-10 h-10 text-primary" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">{file.type}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={isEarlyReveal ? () => setStep('reason') : onClose}
                      >
                        {isEarlyReveal ? 'Back' : 'Cancel'}
                      </Button>
                      <Button onClick={() => setStep('confirm')} className="cosmic-glow">
                        Continue to Reveal
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Confirm Public Reveal
                    </CardTitle>
                    <CardDescription>
                      Your capsule will be visible to everyone on the social feed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Important:</strong> This action cannot be undone. Once revealed, 
                        your capsule content will be publicly visible and cannot be hidden again.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="reveal-message">Reveal Message (Optional)</Label>
                      <Textarea
                        id="reveal-message"
                        value={revealMessage}
                        onChange={(e) => setRevealMessage(e.target.value)}
                        placeholder="Share why you're revealing this capsule early..."
                        className="mt-2"
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {revealMessage.length}/500 characters
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">What happens next:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Your capsule will appear in the public social feed</li>
                        <li>• Other users can like and comment on your reveal</li>
                        <li>• The reveal will be marked as {isEarlyReveal ? 'early' : 'on-time'}</li>
                        <li>• All files and content will be publicly accessible</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setStep('preview')}>
                    Back
                  </Button>
                  <Button onClick={handleReveal} variant="destructive">
                    {isEarlyReveal ? 'Reveal Early' : 'Reveal Now'}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'revealing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Revealing Your Capsule...</h3>
                <p className="text-muted-foreground">
                  Publishing to the social feed and making content public
                </p>
              </motion.div>
            )}

            {step === 'complete' && revealedCapsule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-heading font-bold mb-2">Capsule Revealed!</h3>
                  <p className="text-muted-foreground">
                    Your time capsule is now live in the social feed
                  </p>
                </div>

                <Card className="bg-green-500/10 border-green-500/50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-sm font-semibold">Revealed</Label>
                        <p className="mt-1">{new Date(revealedCapsule.revealMetadata.revealedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Type</Label>
                        <Badge variant={isEarlyReveal ? "destructive" : "default"} className="mt-1">
                          {isEarlyReveal ? 'Early Reveal' : 'On-Time Reveal'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-3">
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                  <Button onClick={() => window.open('/social', '_blank')} className="cosmic-glow">
                    View in Social Feed
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {!decryptedContent && !error && step === 'preview' && (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Decrypting Content...</h3>
                <p className="text-muted-foreground">
                  Please wait while we decrypt your capsule content
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EarlyRevealModal;