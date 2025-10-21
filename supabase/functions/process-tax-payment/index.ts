import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      walletAddress, 
      cryptoAmount, 
      cryptoCurrency, 
      taxAmount, 
      taxType, 
      signature 
    } = await req.json();

    console.log('Processing payment:', {
      walletAddress,
      cryptoAmount,
      cryptoCurrency,
      taxAmount,
      taxType
    });

    // Validate required fields
    if (!walletAddress || !cryptoAmount || !cryptoCurrency || taxAmount === undefined || taxAmount === null || !taxType) {
      throw new Error('Missing required payment fields');
    }

    // Validate positive amounts
    if (taxAmount <= 0 || parseFloat(cryptoAmount) <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Verify signature
    if (signature !== 'verified') {
      throw new Error('Payment signature not verified');
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Simulate payment processing
    // In production, this would:
    // 1. Convert crypto to NGN via Paj Cash
    // 2. Settle to LIRS via Remita
    // 3. Generate NFT receipt on blockchain
    console.log('Payment processed successfully:', transactionId);

    const paymentDetails = {
      transactionId,
      walletAddress,
      cryptoAmount: parseFloat(cryptoAmount),
      cryptoCurrency,
      taxAmount,
      taxType,
      timestamp: new Date().toISOString(),
      status: 'completed',
      conversionRate: cryptoCurrency === 'SOL' ? 0.012 : 1,
      ngnReceived: taxAmount,
      processingFee: 0,
      netAmount: taxAmount
    };

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        details: paymentDetails,
        message: 'Payment processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
