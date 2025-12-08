import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get admin API key from environment
    const adminApiKey = Deno.env.get('ADMIN_API_KEY') || 'your-secret-admin-key-change-this';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid admin key' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Get current admin settings
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Return default settings if none exist
      const defaultSettings = {
        id: 1,
        profit_wallet_address: '',
        payment_enabled: true,
        service_fee_percentage: 2.5,
        min_payment_amount: 1000,
        max_payment_amount: 100000000,
        tax_processing_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return new Response(
        JSON.stringify({
          success: true,
          settings: data || defaultSettings
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Update admin settings
      const {
        profit_wallet_address,
        payment_enabled,
        service_fee_percentage,
        min_payment_amount,
        max_payment_amount,
        tax_processing_enabled
      } = await req.json();

      // Validate wallet address format (basic Solana address validation)
      if (profit_wallet_address && profit_wallet_address.length < 32) {
        throw new Error('Invalid Solana wallet address format');
      }

      // Validate service fee
      if (service_fee_percentage !== undefined && (service_fee_percentage < 0 || service_fee_percentage > 100)) {
        throw new Error('Service fee must be between 0 and 100');
      }

      const settingsData = {
        id: 1,
        profit_wallet_address: profit_wallet_address || null,
        payment_enabled: payment_enabled !== undefined ? payment_enabled : true,
        service_fee_percentage: service_fee_percentage !== undefined ? service_fee_percentage : 2.5,
        min_payment_amount: min_payment_amount !== undefined ? min_payment_amount : 1000,
        max_payment_amount: max_payment_amount !== undefined ? max_payment_amount : 100000000,
        tax_processing_enabled: tax_processing_enabled !== undefined ? tax_processing_enabled : true,
        updated_at: new Date().toISOString()
      };

      // Upsert settings
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert(settingsData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Settings updated successfully',
          settings: data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error) {
    console.error('Admin settings error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    
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

