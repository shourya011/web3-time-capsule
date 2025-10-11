// Frontend/src/components/Messaging/PaymentPanel.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSendTransaction, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { toast } from '@/hooks/use-toast';

interface PaymentPanelProps {
  to: string;
  onClose?: () => void;
  onSuccess?: (txHash: string) => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ to, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  
  const { address, isConnected } = useAccount();
  
  // Get user's ETH balance
  const { data: balance } = useBalance({
    address: address,
  });

  // Send transaction hook
  const { 
    sendTransaction, 
    isPending: isSending, 
    error: sendError,
    reset: resetSend,
    data: txHash
  } = useSendTransaction();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && txHash) {
      toast({
        title: 'Payment Successful!',
        description: `Transaction confirmed: ${txHash.slice(0, 8)}...`,
      });
      if (onSuccess) {
        onSuccess(txHash);
      }
      // Reset form after success
      setAmount('');
      setMemo('');
      resetSend();
    }
  }, [isConfirmed, txHash, onSuccess, resetSend]);

  // Handle errors
  useEffect(() => {
    if (sendError) {
      toast({
        title: 'Transaction Failed',
        description: sendError.message || 'Failed to send transaction',
        variant: 'destructive',
      });
    }
  }, [sendError]);

  useEffect(() => {
    if (confirmError) {
      toast({
        title: 'Confirmation Failed',
        description: confirmError.message || 'Transaction confirmation failed',
        variant: 'destructive',
      });
    }
  }, [confirmError]);

  // Handle transaction sent
  useEffect(() => {
    if (txHash && !isConfirmed && !isConfirming) {
      toast({
        title: 'Transaction Sent',
        description: 'Your payment is being processed...',
      });
    }
  }, [txHash, isConfirmed, isConfirming]);

  const validateAmount = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) return false;
    if (balance && numValue > Number(formatEther(balance.value))) return false;
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSendPayment = () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to send payment.',
        variant: 'destructive',
      });
      return;
    }

    if (!isAddress(to)) {
      toast({
        title: 'Invalid Recipient',
        description: 'The seller address is not valid.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateAmount(amount)) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid ETH amount that you can afford.',
        variant: 'destructive',
      });
      return;
    }

    // Send transaction using wagmi v2 pattern
    sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
    });
  };

  const isProcessing = isSending || isConfirming;
  const canSend = isConnected && validateAmount(amount) && !isProcessing;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Send Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient Info */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <Input
            id="recipient"
            value={to}
            readOnly
            className="font-mono text-sm bg-muted"
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            disabled={isProcessing}
          />
          {balance && (
            <p className="text-sm text-muted-foreground">
              Balance: {Number(formatEther(balance.value)).toFixed(4)} ETH
            </p>
          )}
        </div>

        {/* Memo */}
        <div className="space-y-2">
          <Label htmlFor="memo">Note (Optional)</Label>
          <Input
            id="memo"
            placeholder="Payment for time capsule..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {/* Transaction Status */}
        {txHash && (
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              {isConfirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
              {(sendError || confirmError) && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm font-medium">
                {isConfirming && 'Confirming...'}
                {isConfirmed && 'Confirmed!'}
                {(sendError || confirmError) && 'Failed'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
            <p className="text-sm text-blue-800 mb-3">
              Connect your wallet to send payments
            </p>
            <ConnectButton />
          </div>
        )}

        {/* Action Buttons - Only show when connected */}
        {isConnected && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSendPayment}
              disabled={!canSend}
              className="flex-1"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSending && 'Sending...'}
              {isConfirming && 'Confirming...'}
              {!isProcessing && `Send ${amount || '0'} ETH`}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
