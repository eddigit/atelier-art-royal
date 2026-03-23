// TODO: Implement PDF invoice generation using a library like pdfkit or puppeteer.
// Should pull order data from the database and generate a properly formatted French invoice.

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('generateInvoice called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Invoice generation not configured yet' });
  } catch (error) {
    console.error('generateInvoice error:', error);
    return res.status(500).json({ error: error.message });
  }
};
