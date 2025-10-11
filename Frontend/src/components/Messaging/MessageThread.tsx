// Frontend/src/components/Messaging/MessageThread.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { fetchThread, sendMessage, markAsRead } from './MessageStore';
import { MessageList } from './MessageList';
import { PaymentPanel } from './PaymentPanel';
import type { Message } from '@/types/messaging';

export const MessageThread: React.FC<{ capsuleId: string; sellerAddress: string; open?: boolean; onClose?: () => void }> = ({ capsuleId, sellerAddress, open, onClose }) => {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [isOpen, setIsOpen] = useState(Boolean(open));
  const [activeTab, setActiveTab] = useState('chat');

  const loadThread = useCallback(async () => {
    const t = await fetchThread(capsuleId);
    setMessages(t);
  }, [capsuleId]);

  useEffect(() => {
    if (isOpen) loadThread();
  }, [isOpen, loadThread]);

  const handleSend = async () => {
    if (!address) return;
    if (!body.trim()) return;

    const msg = await sendMessage({ capsuleId, from: address, to: sellerAddress, body });
    setMessages(prev => [...prev, msg]);
    setBody('');
  };

  const handleOpenChange = (val: boolean) => {
    setIsOpen(val);
    if (!val && onClose) onClose();
    if (val) {
      // mark read when opened
      markAsRead(capsuleId, address || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Message Seller</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="p-4">
            <div className="h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <MessageList messages={messages} currentAddress={address} />
              </div>

              <div className="mt-4">
                <Textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  placeholder="Type your message..." 
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSend} disabled={!address || !body.trim()}>
                    Send
                  </Button>
                  <Button variant="outline" onClick={() => setBody('')}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="p-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Make sure you've discussed the details with the seller before sending payment.
              </div>
              <PaymentPanel 
                to={sellerAddress} 
                onSuccess={(txHash) => {
                  // Append payment record to chat
                  const now = Date.now();
                  const paymentMsg: Message = {
                    id: `payment-${now}`,
                    capsuleId,
                    from: address || 'unknown',
                    to: sellerAddress,
                    body: `✅ Payment sent: ${txHash}`,
                    timestamp: now,
                    status: 'sent' as const
                  };
                  setMessages(prev => [...prev, paymentMsg]);
                  // Switch back to chat tab to show the payment message
                  setActiveTab('chat');
                }} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
