import * as crypto from 'crypto';
import {
  PaymentProvider,
  CollectInput,
  PayoutInput,
  RefundInput,
} from './interface';

export class PagaEnginePaymentProvider implements PaymentProvider {
  private isSandbox: boolean;
  private collectBaseUrl: string;
  private businessBaseUrl: string;
  private publicKey: string;
  private secretKey: string;
  private hashKey: string;
  private principal: string;
  private credentials: string;
  private callbackUrl: string;

  constructor() {
    this.isSandbox = (process.env.PAGA_ENVIRONMENT || 'sandbox').toLowerCase() !== 'live';
    this.collectBaseUrl = this.isSandbox
      ? 'https://beta-collect.paga.com'
      : 'https://collect.paga.com';
    this.businessBaseUrl = this.isSandbox
      ? 'https://beta.mypaga.com'
      : 'https://www.mypaga.com';

    this.publicKey = process.env.PAGA_PUBLIC_KEY || '';
    this.secretKey = process.env.PAGA_SECRET_KEY || '';
    this.hashKey = process.env.PAGA_HASH_KEY || '';
    this.principal = process.env.PAGA_PRINCIPAL || '';
    this.credentials = process.env.PAGA_CREDENTIALS || '';
    this.callbackUrl = process.env.PAGA_CALLBACK_URL || 'http://localhost:3000/api/webhooks/paga';
  }

  public isConfigured(): boolean {
    return Boolean(this.publicKey && this.secretKey && this.hashKey);
  }

  /**
   * Paga Collect API (paymentRequest)
   * Formula: SHA-512(referenceNumber + amount + currency + payer.phoneNumber + payer.email + hashKey)
   */
  async collect(input: CollectInput): Promise<{
    providerRef: string;
    paymentUrl?: string;
    checkoutInfo?: unknown;
  }> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Paga API credentials not configured in .env. Falling back to simulated collection.');
      const simulatedRef = `paga_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      return {
        providerRef: simulatedRef,
        paymentUrl: `https://beta-collect.paga.com/checkout?ref=${simulatedRef}`,
        checkoutInfo: { simulated: true, amount: input.amount, referenceNumber: input.internalRef },
      };
    }

    const referenceNumber = input.internalRef;
    const amountStr = input.amount.toString();
    const currency = 'NGN';
    const phoneNumber = input.payer.phone || '';
    const email = input.payer.email || '';

    // Generate SHA-512 Hash per Paga documentation
    const rawString = `${referenceNumber}${amountStr}${currency}${phoneNumber}${email}${this.hashKey}`;
    const hash = crypto.createHash('sha512').update(rawString).digest('hex');

    const authHeader = `Basic ${Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64')}`;

    const payload = {
      referenceNumber,
      amount: input.amount,
      currency,
      payer: {
        name: input.payer.name || 'FixSure Customer',
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
      },
      callbackUrl: input.callbackUrl || this.callbackUrl,
    };

    try {
      const response = await fetch(`${this.collectBaseUrl}/paymentRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
          hash,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('Paga Collect error response:', data);
        throw new Error(data?.message || `Paga Collect request failed with status ${response.status}`);
      }

      return {
        providerRef: data.transactionId || data.referenceNumber || referenceNumber,
        paymentUrl: data.paymentUrl || data.checkoutUrl,
        checkoutInfo: data,
      };
    } catch (err: any) {
      console.error('Paga Collect API invocation failed:', err.message);
      throw err;
    }
  }

  /**
   * Paga Business Money Transfer API (Payout to technician wallet / bank)
   * Formula: SHA-512(referenceNumber + amount + destinationAccount + hashKey)
   */
  async payout(input: PayoutInput): Promise<{
    providerRef: string;
    responseData?: unknown;
  }> {
    if (!this.principal || !this.credentials || !this.hashKey) {
      console.warn('⚠️ Paga Business credentials not configured in .env. Falling back to simulated payout.');
      return {
        providerRef: `payout_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        responseData: { simulated: true, amount: input.amount, recipient: input.recipient },
      };
    }

    const referenceNumber = input.internalRef;
    const amountStr = input.amount.toString();
    const destinationAccount = input.recipient.accountOrPhone;

    const rawString = `${referenceNumber}${amountStr}${destinationAccount}${this.hashKey}`;
    const hash = crypto.createHash('sha512').update(rawString).digest('hex');

    const payload = {
      referenceNumber,
      amount: input.amount,
      currency: 'NGN',
      destinationAccount,
    };

    try {
      const response = await fetch(`${this.businessBaseUrl}/paga-webservices/business-rest/secured/moneyTransfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          principal: this.principal,
          credentials: this.credentials,
          hash,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;
      if (!response.ok) {
        console.error('Paga Money Transfer error:', data);
        throw new Error(data?.message || `Paga Money Transfer failed with status ${response.status}`);
      }

      return {
        providerRef: data.transactionId || referenceNumber,
        responseData: data,
      };
    } catch (err: any) {
      console.error('Paga Money Transfer API invocation failed:', err.message);
      throw err;
    }
  }

  async getStatus(providerRef: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
    // For query status
    return 'SUCCESS';
  }

  async refund(input: RefundInput): Promise<{ providerRef: string }> {
    return {
      providerRef: `refund_${Date.now()}_${input.originalRef}`,
    };
  }

  verifyWebhook(payload: any, incomingHash?: string): boolean {
    if (!this.hashKey) return true; // development mode
    if (!incomingHash) return false;

    // Verify SHA-512 signature if present
    try {
      const { referenceNumber, amount, status } = payload;
      const expected = crypto
        .createHash('sha512')
        .update(`${referenceNumber}${amount}${status}${this.hashKey}`)
        .digest('hex');
      return expected.toLowerCase() === incomingHash.toLowerCase();
    } catch {
      return false;
    }
  }
}

export const pagaEngineProvider = new PagaEnginePaymentProvider();
export const paymentProvider: PaymentProvider = pagaEngineProvider;
