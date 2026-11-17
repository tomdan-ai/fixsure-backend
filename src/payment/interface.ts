export interface CollectInput {
  internalRef: string;
  amount: number;
  payer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  callbackUrl?: string;
}

export interface PayoutInput {
  internalRef: string;
  amount: number;
  recipient: {
    accountOrPhone: string;
    name?: string;
    bankUUID?: string;
    bankAccountNumber?: string;
  };
}

export interface RefundInput {
  internalRef: string;
  amount: number;
  originalRef: string;
}

export interface PaymentProvider {
  collect(input: CollectInput): Promise<{
    providerRef: string;
    paymentUrl?: string;
    checkoutInfo?: unknown;
  }>;
  getStatus(providerRef: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'>;
  payout(input: PayoutInput): Promise<{
    providerRef: string;
    responseData?: unknown;
  }>;
  refund(input: RefundInput): Promise<{
    providerRef: string;
  }>;
  verifyWebhook(payload: any, incomingHash?: string): boolean;
}
