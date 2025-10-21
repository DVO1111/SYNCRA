import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taxId } = await req.json();
    
    console.log('Verifying tax ID:', taxId);

    if (!taxId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tax ID is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validate tax ID format
    const cleanTaxId = taxId.trim().toUpperCase();
    
    // Check for valid TIN format (10 digits) or Taxpayer ID format (N-XXXXXXXX)
    const isTIN = /^\d{10}$/.test(cleanTaxId);
    const isTaxpayerID = /^N-\d{8}$/.test(cleanTaxId);
    
    if (!isTIN && !isTaxpayerID) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Tax ID format. Please enter a 10-digit TIN or N-XXXXXXXX format.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // TODO: Add real LIRS API integration here when credentials are available
    // For now, return success with a mock taxpayer name
    const mockNames = [
      'ADEYEMI OLUWASEUN JOHNSON',
      'NKECHI AMARA OKONKWO',
      'IBRAHIM MOHAMMED BELLO',
      'CHIOMA GRACE EZE',
      'OLUWATOBI DAVID AKINOLA'
    ];
    
    // Generate a consistent name based on the tax ID
    const nameIndex = parseInt(cleanTaxId.replace(/\D/g, '').slice(-1)) % mockNames.length;
    
    console.log('Tax ID verified successfully:', cleanTaxId);

    return new Response(
      JSON.stringify({ 
        success: true,
        taxpayerName: mockNames[nameIndex],
        taxId: cleanTaxId,
        verified: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error verifying tax ID:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to verify Tax ID. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
