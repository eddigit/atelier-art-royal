import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { checkoutId } = await req.json();

    if (!checkoutId) {
      return Response.json({ error: 'Checkout ID required' }, { status: 400 });
    }

    // Get checkout status from SumUp
    const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
      },
    });

    if (!response.ok) {
      return Response.json({ error: 'Failed to verify payment' }, { status: 400 });
    }

    const checkout = await response.json();
    
    return Response.json({
      success: true,
      status: checkout.status,
      transactionId: checkout.transaction_id,
      amount: checkout.amount,
      currency: checkout.currency,
      paid: checkout.status === 'PAID',
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});