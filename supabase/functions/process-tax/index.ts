import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Get all tax processing records
      const { status, limit = 50, offset = 0 } = req.url.includes('?') 
        ? Object.fromEntries(new URL(req.url).searchParams.entries())
        : { status: 'all', limit: 50, offset: 0 };

      let query = supabase
        .from('tax_processing')
        .select('*')
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          records: data || [],
          count: data?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'POST') {
      // Create new tax processing record
      const {
        payer_id,
        wallet_address,
        tax_type,
        tax_amount,
        income_amount,
        transaction_id,
        status = 'pending',
        notes
      } = await req.json();

      // Validate required fields
      if (!payer_id || !wallet_address || !tax_type || !tax_amount || !transaction_id) {
        throw new Error('Missing required fields: payer_id, wallet_address, tax_type, tax_amount, transaction_id');
      }

      // Get admin settings for service fee calculation
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('service_fee_percentage')
        .eq('id', 1)
        .single();

      const serviceFeePercentage = settings?.service_fee_percentage || 2.5;
      const serviceFee = (tax_amount * serviceFeePercentage) / 100;
      const netAmount = tax_amount - serviceFee;

      const taxRecord = {
        payer_id,
        wallet_address,
        tax_type,
        tax_amount: parseFloat(tax_amount),
        income_amount: parseFloat(income_amount || 0),
        transaction_id,
        status,
        service_fee: serviceFee,
        net_amount: netAmount,
        notes: notes || null,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tax_processing')
        .insert(taxRecord)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tax processing record created',
          record: data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201
        }
      );
    }

    if (req.method === 'PATCH') {
      // Update tax processing record status
      const { id, status, notes } = await req.json();

      if (!id || !status) {
        throw new Error('Missing required fields: id, status');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('tax_processing')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tax processing record updated',
          record: data
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
    console.error('Tax processing error:', error);
    
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

