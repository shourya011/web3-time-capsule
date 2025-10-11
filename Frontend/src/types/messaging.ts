// Frontend/src/types/messaging.ts

export interface Message {
  id: string;
  capsuleId: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  signed?: string;
  status?: 'sent' | 'delivered' | 'failed';
}

export interface Payment {
  id: string;
  txHash: string;
  from: string;
  to: string;
  amount: string; // ETH string
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  memo?: string;
}
