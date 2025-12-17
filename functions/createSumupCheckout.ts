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

    // Create SumUp checkout
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: reference,
        amount: parseFloat(amount).toFixed(2),
        currency: 'EUR',
        merchant_code: SUMUP_MERCHANT_CODE,
        description: description || 'Atelier Art Royal - Commande',
        return_url: `https://691cd26ea8838a859856a6b6.base44.app/OrderConfirmation?order=${reference}`,
      }),
    });

    const responseText = await response.text();
    console.log('SumUp Response:', response.status, responseText);

    if (!response.ok) {
      let errorMsg = 'SumUp API error';
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.error_message || error.message || errorMsg;
      } catch (e) {
        errorMsg = responseText;
      }
      return Response.json({ 
        success: false,
        error: errorMsg,
        details: responseText 
      }, { status: 400 });
    }

    const checkout = JSON.parse(responseText);
    
    return Response.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout._links?.['online-checkout']?.href || `https://pay.sumup.com/${checkout.id}`,
      amount: checkout.amount,
      currency: checkout.currency,
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});