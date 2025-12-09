import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taxId } = await req.json();

    console.log('Verifying Tax ID:', taxId);

    // Validate required field
    if (!taxId || typeof taxId !== 'string' || !taxId.trim()) {
      throw new Error('Tax ID is required');
    }

    const cleanedTaxId = taxId.trim().toUpperCase();

    // Validate Tax ID format
    // Nigerian TIN format: 10 digits OR N-XXXXXXXX format
    const tinPattern = /^(\d{10}|N-\d{8})$/;
    
    if (!tinPattern.test(cleanedTaxId)) {
      throw new Error('Invalid Tax ID format. Please enter a 10-digit TIN or N-XXXXXXXX format');
    }

    // Simulate LIRS Tax ID verification
    // In production, this would call the LIRS API to verify the tax ID
    // For now, we'll simulate a successful verification with mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock taxpayer data (in production, fetch from LIRS API)
    const mockTaxpayers: Record<string, { name: string; status: string }> = {
      '1234567890': { name: 'John Doe', status: 'active' },
      '9876543210': { name: 'Jane Smith', status: 'active' },
      'N-12345678': { name: 'ABC Company Ltd', status: 'active' },
      'N-87654321': { name: 'XYZ Enterprises', status: 'active' },
    };

    // Check if it's a known test ID, otherwise simulate verification
    const taxpayer = mockTaxpayers[cleanedTaxId];
    
    if (taxpayer) {
      // Known test taxpayer
      return new Response(
        JSON.stringify({
          success: true,
          taxId: cleanedTaxId,
          taxpayerName: taxpayer.name,
          status: taxpayer.status,
          message: 'Tax ID verified successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      // Simulate verification for any valid format
      // In production, replace this with actual LIRS API call
      const simulatedName = `Taxpayer ${cleanedTaxId.slice(-4)}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          taxId: cleanedTaxId,
          taxpayerName: simulatedName,
          status: 'active',
          message: 'Tax ID verified successfully',
          note: 'This is a simulated verification. In production, this would verify with LIRS.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

  } catch (error) {
    console.error('Tax ID verification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Tax ID verification failed';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
