// TODO: Implement PDF quote generation using pdfkit or puppeteer.
// Should pull quote data from the database and generate a formatted devis/quote document.

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
    console.log('generateQuotePdf called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Quote PDF generation not configured yet' });
  } catch (error) {
    console.error('generateQuotePdf error:', error);
    return res.status(500).json({ error: error.message });
  }
};
