// Frontend/src/components/Messaging/PaymentModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentPanel } from './PaymentPanel';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  sellerAddress: string;
  capsuleTitle?: string;
  onSuccess?: (txHash: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  open, 
  onClose, 
  sellerAddress, 
  capsuleTitle,
  onSuccess 
}) => {
  const handlePaymentSuccess = (txHash: string) => {
    if (onSuccess) {
      onSuccess(txHash);
    }
    // Auto-close modal after successful payment
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Pay Seller {capsuleTitle ? `- ${capsuleTitle}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <PaymentPanel 
            to={sellerAddress}
            onClose={onClose}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};