import { useState, useCallback, useMemo, memo } from 'react';
import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { CosmicButton } from '@/components/CosmicButton';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Calendar, 
  Lock, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  FileText, 
  Image, 
  Video, 
  Music, 
  File,
  Download,
  Shield,
  Users,
  Plus,
  X,
  Loader
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { cryptoService, type RecoveryKit, type EncryptedData } from '@/lib/crypto';
import { ipfsService } from '@/lib/ipfs';
import { timeCapsuleContract } from '@/lib/contract';
import { isValidAddress, isValidEnsName, resolveEnsAddress } from '@/lib/ens';

type Step = 1 | 2 | 3 | 4 | 5;

interface UploadedFile {
  id: string;
  file: File;
  type: string;
  size: number;
  preview?: string;
}

interface FormData {
  title: string;
  description: string;
  unlockDate: string;
  recipients: string[];
  files: UploadedFile[];
}

const CreateCapsule = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    unlockDate: '',
    recipients: [],
    files: [],
  });
  const [newRecipient, setNewRecipient] = useState('');
  const [encryptedData, setEncryptedData] = useState<EncryptedData | null>(null);
  const [recoveryKit, setRecoveryKit] = useState<RecoveryKit | null>(null);

  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Details', icon: FileText },
    { number: 2, title: 'Content Upload', icon: Upload },
    { number: 3, title: 'Lock Time & Recipients', icon: Calendar },
    { number: 4, title: 'Encrypt & Upload', icon: Shield },
    { number: 5, title: 'Confirmation', icon: CheckCircle },
  ];

  // Optimized input handlers to prevent re-renders
  const updateFormField = useCallback((field: keyof FormData) => {
    return (value: string | string[] | UploadedFile[]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField('title')(e.target.value);
  }, [updateFormField]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormField('description')(e.target.value);
  }, [updateFormField]);

  const handleUnlockDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField('unlockDate')(e.target.value);
  }, [updateFormField]);

  const handlePresetDate = useCallback((years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    updateFormField('unlockDate')(date.toISOString().slice(0, 16));
  }, [updateFormField]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file) => {
      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36),
        file,
        type: file.type,
        size: file.size,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, preview: e.target?.result as string }
                : f
            )
          }));
        };
        reader.readAsDataURL(file);
      }

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, uploadedFile]
      }));
    });
  }, []);

  const removeFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  const addRecipient = async () => {
    if (!newRecipient.trim()) return;

    let address = newRecipient.trim();

    // Resolve ENS name if needed
    if (isValidEnsName(address)) {
      const resolvedAddress = await resolveEnsAddress(address);
      if (!resolvedAddress) {
        toast({
          title: "Invalid ENS name",
          description: "Could not resolve ENS name to address.",
          variant: "destructive",
        });
        return;
      }
      address = resolvedAddress;
    }

    if (!isValidAddress(address)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address or ENS name.",
        variant: "destructive",
      });
      return;
    }

    if (formData.recipients.includes(address)) {
      toast({
        title: "Duplicate recipient",
        description: "This address is already in the recipients list.",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, address]
    }));
    setNewRecipient('');
  };

  const removeRecipient = (addressToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(addr => addr !== addressToRemove)
    }));
  };

  const encryptAndUpload = async () => {
    console.log('🔄 encryptAndUpload called', { isConnected, address, formData });
    
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare content for encryption
      const content = {
        title: formData.title,
        description: formData.description,
        files: formData.files.length > 0 ? await Promise.all(formData.files.map(async (uploadedFile) => {
          const { encryptedData, originalName, type } = await cryptoService.encryptFile(uploadedFile.file);
          return {
            name: originalName,
            type,
            size: uploadedFile.file.size,
            encryptedData: cryptoService.arrayBufferToBase64(encryptedData.encryptedContent),
            iv: cryptoService.arrayBufferToBase64(encryptedData.iv),
            key: cryptoService.arrayBufferToBase64(encryptedData.key),
          };
        })) : [],
        createdAt: Date.now(),
        creator: address,
      };

      // Encrypt the entire content
      const contentString = JSON.stringify(content);
      const encrypted = await cryptoService.encrypt(contentString);
      setEncryptedData(encrypted);

      // Upload to IPFS
      const encryptedContentBase64 = cryptoService.arrayBufferToBase64(encrypted.encryptedContent);
      const ipfsResult = await ipfsService.uploadString(encryptedContentBase64, 'capsule-content.enc');
      
      toast({
        title: "Content encrypted and uploaded",
        description: "Your content has been securely encrypted and uploaded to IPFS.",
      });

      handleNext();
    } catch (error) {
      toast({
        title: "Encryption failed",
        description: "Failed to encrypt and upload content.",
        variant: "destructive",
      });
      console.error('Encryption error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCapsule = async () => {
    if (!isConnected || !address || !encryptedData) {
      toast({
        title: "Missing data",
        description: "Please complete all steps before creating the capsule.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload encrypted content to IPFS (already done in previous step)
      const encryptedContentBase64 = cryptoService.arrayBufferToBase64(encryptedData.encryptedContent);
      const ipfsResult = await ipfsService.uploadString(encryptedContentBase64, 'capsule-content.enc');
      
      // Get unlock timestamp
      const unlockTime = Math.floor(new Date(formData.unlockDate).getTime() / 1000);
      
      // Add creator to recipients if not already included
      const recipients = formData.recipients.includes(address) 
        ? formData.recipients 
        : [address, ...formData.recipients];

      // Create capsule on contract
      const capsuleId = await timeCapsuleContract.createCapsule({
        title: formData.title,
        description: formData.description,
        content: ipfsResult.cid,
        unlockDate: new Date(formData.unlockDate),
        visibility: 'public',
        recipients: formData.recipients,
      });

      // Create recovery kit
      const kit = cryptoService.createRecoveryKit(encryptedData, capsuleId);
      setRecoveryKit(kit);

      toast({
        title: "Time capsule created!",
        description: "Your time capsule has been successfully created and locked on the blockchain.",
      });

      handleNext();
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Failed to create time capsule. Please try again.",
        variant: "destructive",
      });
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadRecoveryKit = () => {
    if (!recoveryKit) return;

    const blob = new Blob([JSON.stringify(recoveryKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-capsule-${recoveryKit.capsuleId}-recovery-kit.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Recovery kit downloaded",
      description: "Keep this file safe! You'll need it to unlock your capsule.",
    });
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

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <SpaceBackground />
        <Navigation />
        
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-heading font-bold mb-4 text-gradient">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              You need to connect your wallet to create a time capsule.
            </p>
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Wallet Required
                </CardTitle>
                <CardDescription>
                  Time capsules are stored on the blockchain and require a wallet connection.
                </CardDescription>
              </CardHeader>
            </Card>
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
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-heading font-bold mb-4 text-gradient">
              Create Time Capsule
            </h1>
            <p className="text-xl text-muted-foreground">
              Preserve your memories for the future with Web3 security
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-muted -z-10">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex flex-col items-center relative z-10">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? 'cosmic-glow bg-primary'
                          : isCompleted
                          ? 'bg-accent'
                          : 'bg-muted'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="glass-panel p-8 rounded-xl">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Capsule Details</h2>
                
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Give your time capsule a memorable name"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe what you're preserving for the future..."
                    className="mt-2 min-h-32"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Upload Content</h2>

                <div className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer cosmic-glow-accent">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      Support for images, videos, documents, and audio files
                    </p>
                  </label>
                </div>

                {formData.files.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Uploaded Files ({formData.files.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.files.map((uploadedFile) => {
                        const FileIcon = getFileIcon(uploadedFile.type);
                        return (
                          <div key={uploadedFile.id} className="glass-panel p-4 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {uploadedFile.preview ? (
                                  <img 
                                    src={uploadedFile.preview} 
                                    alt={uploadedFile.file.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <FileIcon className="w-12 h-12 text-primary" />
                                )}
                                <div>
                                  <p className="font-semibold truncate">{uploadedFile.file.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatFileSize(uploadedFile.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(uploadedFile.id)}
                                className="text-destructive hover:bg-destructive/20 p-1 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Lock Time & Recipients</h2>

                <div>
                  <Label htmlFor="unlock-date">Unlock Date *</Label>
                  <Input
                    id="unlock-date"
                    type="datetime-local"
                    value={formData.unlockDate}
                    onChange={handleUnlockDateChange}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {['1 Year', '5 Years', '10 Years'].map((preset) => (
                    <CosmicButton
                      key={preset}
                      variant="outline"
                      className="py-8"
                      onClick={() => handlePresetDate(parseInt(preset))}
                    >
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <span className="font-bold">{preset}</span>
                      </div>
                    </CosmicButton>
                  ))}
                </div>

                <div className="mt-8">
                  <Label htmlFor="recipients">Recipients (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add wallet addresses or ENS names who can access this capsule when unlocked.
                    You are automatically included as a recipient.
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="0x... or vitalik.eth"
                      className="flex-1"
                    />
                    <CosmicButton onClick={addRecipient} disabled={!newRecipient.trim()}>
                      <Plus className="w-4 h-4" />
                    </CosmicButton>
                  </div>

                  {formData.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.recipients.map((recipient, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {`${recipient.slice(0, 6)}...${recipient.slice(-4)}`}
                          <button
                            onClick={() => removeRecipient(recipient)}
                            className="ml-2 text-destructive hover:text-destructive/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Encrypt & Upload to IPFS</h2>

                <div className="glass-panel p-6 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Client-Side Encryption</h3>
                      <p className="text-sm text-muted-foreground">
                        Your capsule content (title, description, and files) will be encrypted locally before uploading to IPFS
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Files to encrypt:</span>
                      <Badge>{formData.files.length} files</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total size:</span>
                      <Badge>{formatFileSize(formData.files.reduce((acc, f) => acc + f.size, 0))}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Encryption method:</span>
                      <Badge variant="outline">AES-GCM 256-bit</Badge>
                    </div>
                  </div>
                </div>

                <CosmicButton 
                  onClick={encryptAndUpload} 
                  disabled={loading || !formData.title.trim()}
                  className="w-full py-4"
                  glow
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Encrypting & Uploading...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Encrypt & Upload to IPFS
                    </>
                  )}
                </CosmicButton>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Review & Create Capsule</h2>

                <div className="space-y-4">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle>{formData.title}</CardTitle>
                      <CardDescription>{formData.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Unlock Date:</span>
                        <span>{new Date(formData.unlockDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Files:</span>
                        <span>{formData.files.length} files</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recipients:</span>
                        <span>{formData.recipients.length + 1} addresses</span>
                      </div>
                    </CardContent>
                  </Card>

                  {recoveryKit && (
                    <Card className="glass-panel border-green-500/50">
                      <CardHeader>
                        <CardTitle className="text-green-500 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Recovery Kit Ready
                        </CardTitle>
                        <CardDescription>
                          Download your recovery kit to decrypt the capsule when it unlocks.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CosmicButton onClick={downloadRecoveryKit} className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Recovery Kit
                        </CosmicButton>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="p-6 bg-accent/10 border border-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Important:</strong> Once created, your time capsule will be immutably locked 
                    on the Base blockchain and cannot be modified or deleted until the unlock date.
                    Make sure to save your recovery kit!
                  </p>
                </div>

                {!recoveryKit && (
                  <CosmicButton 
                    onClick={createCapsule} 
                    disabled={loading}
                    className="w-full py-4"
                    glow
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Creating Capsule...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Lock Capsule on Blockchain
                      </>
                    )}
                  </CosmicButton>
                )}

                {recoveryKit && (
                  <CosmicButton 
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-4"
                    glow
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    View in Dashboard
                  </CosmicButton>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <CosmicButton
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </CosmicButton>

              {currentStep < 4 && (
                <CosmicButton 
                  onClick={handleNext} 
                  glow
                  disabled={
                    loading ||
                    (currentStep === 1 && !formData.title.trim()) ||
                    (currentStep === 3 && !formData.unlockDate)
                  }
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </CosmicButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

CreateCapsule.displayName = 'CreateCapsule';

export default memo(CreateCapsule);
