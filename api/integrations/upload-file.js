// TODO: Implement file upload forwarding to VPS storage.
// Should accept multipart form data and store files on the VPS filesystem or S3-compatible storage.
// Return the public URL of the uploaded file.

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
    console.log('upload-file called');
    return res.status(200).json({ success: true, message: 'File upload not configured yet. TODO: forward to VPS.' });
  } catch (error) {
    console.error('upload-file error:', error);
    return res.status(500).json({ error: error.message });
  }
};
