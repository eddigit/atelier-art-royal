function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function stub(name) {
  return async (_req, res) => {
    console.log(`[STUB] Integration ${name} called`);
    return res.status(200).json({ success: true, message: `${name}: not configured yet` });
  };
}

const HANDLERS = {
  'send-email': stub('send-email'),
  'upload-file': stub('upload-file'),
  'invoke-llm': stub('invoke-llm'),
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const name = req.query.name;
    const fn = HANDLERS[name];
    if (!fn) return res.status(404).json({ error: `Unknown integration: ${name}` });
    return await fn(req, res);
  } catch (error) {
    console.error('Integration error:', error);
    return res.status(500).json({ error: error.message });
  }
};
