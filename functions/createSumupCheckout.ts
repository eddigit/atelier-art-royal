import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY");
const SUMUP_MERCHANT_CODE = "MDELMUGR";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, reference, description } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!SUMUP_API_KEY) {
      console.error('SUMUP_API_KEY not configured');
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const payload = {
      checkout_reference: reference,
      amount: parseFloat(amount),
      currency: 'EUR',
      merchant_code: SUMUP_MERCHANT_CODE,
      description: description || 'Atelier Art Royal - Commande',
      redirect_url: `https://691cd26ea8838a859856a6b6-691cd26ea8838a859856a6b6.base44.app/OrderConfirmation?order=${reference}`,
      hosted_checkout: {
        enabled: true
      }
    };

    console.log('Creating SumUp checkout with payload:', JSON.stringify(payload, null, 2));

    // Create SumUp checkout
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('SumUp Response Status:', response.status);
    console.log('SumUp Response Body:', responseText);

    if (!response.ok) {
      let errorMsg = 'SumUp API error';
      let errorDetails = responseText;
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.error_message || error.message || errorMsg;
        errorDetails = JSON.stringify(error, null, 2);
      } catch (e) {
        // responseText is not JSON
      }
      console.error('SumUp Error:', errorDetails);
      return Response.json({ 
        success: false,
        error: errorMsg,
        details: errorDetails 
      }, { status: 400 });
    }

    const checkout = JSON.parse(responseText);
    console.log('✅ SumUp Checkout Created:', JSON.stringify(checkout, null, 2));
    
    if (!checkout.id || !checkout.hosted_checkout_url) {
      console.error('❌ Missing checkout ID or hosted URL');
      return Response.json({ 
        success: false,
        error: 'Réponse SumUp invalide',
        fullResponse: checkout
      }, { status: 500 });
    }
    
    console.log('✅ Checkout URL:', checkout.hosted_checkout_url);
    
    return Response.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout.hosted_checkout_url,
      amount: checkout.amount,
      currency: checkout.currency
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});