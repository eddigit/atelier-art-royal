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
        merchant_code: SUMUP_MERCHANT_CODE,
        amount: parseFloat(amount),
        currency: 'EUR',
        checkout_reference: reference,
        description: description || 'Atelier Art Royal - Commande',
        redirect_url: `${Deno.env.get('BASE44_APP_URL') || 'https://votre-site.fr'}/OrderConfirmation?order=${reference}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.error_message || 'SumUp error' }, { status: 400 });
    }

    const checkout = await response.json();
    
    return Response.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: `https://pay.sumup.com/${checkout.id}`,
      amount: checkout.amount,
      currency: checkout.currency,
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});