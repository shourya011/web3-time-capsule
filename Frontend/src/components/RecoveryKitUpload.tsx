import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, X, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cryptoService, type RecoveryKit } from '@/lib/crypto';

interface RecoveryKitUploadProps {
  onValidKit: (kit: RecoveryKit) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  capsuleId?: string; // Optional: validate against specific capsule
}

export const RecoveryKitUpload: React.FC<RecoveryKitUploadProps> = ({
  onValidKit,
  onError,
  onCancel,
  capsuleId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'none' | 'success' | 'error';
    message?: string;
    kit?: RecoveryKit;
  }>({ status: 'none' });

  const validateAndProcessKit = useCallback(async (fileContent: string) => {
    setIsValidating(true);
    setValidationResult({ status: 'none' });

    try {
      // Parse JSON
      let parsedKit: unknown;
      try {
        console.log('Parsing recovery kit JSON...');
        parsedKit = JSON.parse(fileContent);
        console.log('Parsed kit:', parsedKit);
      } catch (error) {
        console.error('JSON parse error:', error);
        throw new Error('Invalid JSON format. Please upload a valid recovery kit file.');
      }

      // Validate recovery kit structure
      console.log('Validating recovery kit structure...');
      const validation = cryptoService.validateRecoveryKit(parsedKit);
      if (!validation.isValid) {
        console.error('Validation failed:', validation.error);
        throw new Error(validation.error || 'Invalid recovery kit format');
      }

      const kit = parsedKit as RecoveryKit;
      console.log('Recovery kit validated successfully:', kit);

      // If capsuleId is provided, validate it matches
      if (capsuleId && kit.capsuleId !== capsuleId) {
        throw new Error(`This recovery kit is for capsule ${kit.capsuleId}, but you're trying to reveal capsule ${capsuleId}`);
      }

      // Success
      setValidationResult({
        status: 'success',
        message: 'Recovery kit validated successfully!',
        kit,
      });

      // Call success callback
      onValidKit(kit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      setValidationResult({
        status: 'error',
        message: errorMessage,
      });
      onError(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, [onValidKit, onError, capsuleId]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      onError('Please select a JSON file (.json)');
      return;
    }

    if (file.size > 10 * 1024) { // 10KB limit
      onError('File too large. Recovery kit files should be small JSON files.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      validateAndProcessKit(content);
    };
    reader.onerror = () => {
      onError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  }, [validateAndProcessKit, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      onError('No files selected');
      return;
    }

    if (files.length > 1) {
      onError('Please select only one recovery kit file');
      return;
    }

    handleFileSelect(files[0]);
  }, [handleFileSelect, onError]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    handleFileSelect(files[0]);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const resetUpload = () => {
    setValidationResult({ status: 'none' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Upload Recovery Kit
          </CardTitle>
          <CardDescription>
            Upload your recovery kit JSON file to decrypt and reveal your time capsule
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {validationResult.status === 'none' && (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-primary/50 hover:border-primary hover:bg-primary/5'
                  }
                  ${isValidating ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('recovery-kit-input')?.click()}
              >
                <input
                  id="recovery-kit-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isValidating}
                />
                
                <div className="space-y-4">
                  {isValidating ? (
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  ) : (
                    <Upload className="w-12 h-12 text-primary mx-auto" />
                  )}
                  
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      {isValidating ? 'Validating recovery kit...' : 'Drop your recovery kit here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isValidating 
                        ? 'Please wait while we validate your recovery kit'
                        : 'or click to browse for a .json file'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Alert */}
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  <strong>What is a recovery kit?</strong><br />
                  Your recovery kit is a JSON file that was downloaded when you created your time capsule. 
                  It contains the encryption keys needed to decrypt your capsule content.
                </AlertDescription>
              </Alert>

              {/* Security Warning */}
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong><br />
                  Once you reveal your capsule, it will be permanently visible in the social feed. 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Validation Success */}
          {validationResult.status === 'success' && validationResult.kit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  {validationResult.message}
                </AlertDescription>
              </Alert>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">Recovery Kit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capsule ID:</span>
                    <span className="font-mono">{validationResult.kit.capsuleId}</span>
                  </div>
                  {validationResult.kit.metadata && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(validationResult.kit.metadata.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{validationResult.kit.metadata.version}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={resetUpload} variant="outline" className="flex-1">
                  Upload Different Kit
                </Button>
              </div>
            </motion.div>
          )}

          {/* Validation Error */}
          {validationResult.status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Alert variant="destructive">
                <X className="w-4 h-4" />
                <AlertDescription>
                  {validationResult.message}
                </AlertDescription>
              </Alert>

              <Button onClick={resetUpload} variant="outline" className="w-full">
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Cancel Button */}
          {onCancel && (
            <div className="pt-4 border-t">
              <Button onClick={onCancel} variant="ghost" className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecoveryKitUpload;