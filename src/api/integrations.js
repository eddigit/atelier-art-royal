const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const UploadFile = async ({ file }) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/api/integrations/upload-file`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData
  });
  if (!response.ok) throw new Error('Upload failed');
  return await response.json(); // { file_url: '...' }
};

export const SendEmail = async (params) => {
  console.warn('SendEmail: not configured yet', params);
  return { success: true };
};

export const InvokeLLM = async (params) => {
  const response = await fetch(`${API_URL}/api/integrations/invoke-llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(params)
  });
  if (!response.ok) throw new Error('LLM invocation failed');
  return await response.json();
};

export const SendSMS = async (params) => {
  console.warn('SendSMS: not configured yet', params);
  return { success: true };
};

export const GenerateImage = async (params) => {
  console.warn('GenerateImage: not configured yet', params);
  return { image_url: '' };
};

export const ExtractDataFromUploadedFile = async (params) => {
  console.warn('ExtractDataFromUploadedFile: not configured yet', params);
  return {};
};

export const Core = {
  UploadFile,
  SendEmail,
  InvokeLLM,
  SendSMS,
  GenerateImage,
  ExtractDataFromUploadedFile
};
