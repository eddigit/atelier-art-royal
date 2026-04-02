/**
 * Send email via AWS SES using raw HTTPS (no SDK needed).
 * Works on Vercel serverless without extra dependencies.
 */
import crypto from 'crypto';

const REGION = process.env.AWS_SES_REGION || 'eu-north-1';
const ACCESS_KEY = process.env.AWS_SES_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY;
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'contact@artroyal.fr';

function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data).digest(encoding);
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getSignatureKey(key, dateStamp, region, service) {
  const kDate = hmac('AWS4' + key, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/**
 * Send an email via SES API (v1 Action=SendEmail)
 */
export async function sendEmail({ to, subject, bodyHtml, bodyText, from, replyTo }) {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('SES credentials not configured');
    return { success: false, error: 'SES not configured' };
  }

  const fromAddr = from || FROM_EMAIL;
  const host = `email.${REGION}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const method = 'POST';

  // Build form body
  const params = new URLSearchParams();
  params.append('Action', 'SendEmail');
  params.append('Source', fromAddr);
  params.append('Destination.ToAddresses.member.1', to);
  params.append('Message.Subject.Data', subject);
  params.append('Message.Subject.Charset', 'UTF-8');

  if (bodyHtml) {
    params.append('Message.Body.Html.Data', bodyHtml);
    params.append('Message.Body.Html.Charset', 'UTF-8');
  }
  if (bodyText) {
    params.append('Message.Body.Text.Data', bodyText);
    params.append('Message.Body.Text.Charset', 'UTF-8');
  }
  if (replyTo) {
    params.append('ReplyToAddresses.member.1', replyTo);
  }

  const body = params.toString();

  // AWS Signature V4
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const contentType = 'application/x-www-form-urlencoded; charset=utf-8';

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  const payloadHash = sha256(body);
  const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${REGION}/ses/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, 'ses');
  const signature = hmac(signingKey, stringToSign, 'hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': contentType,
        'X-Amz-Date': amzDate,
        'Authorization': authHeader,
      },
      body,
    });

    const text = await response.text();
    if (response.ok) {
      const messageId = text.match(/<MessageId>([^<]+)<\/MessageId>/)?.[1];
      console.log(`Email sent to ${to}: ${messageId}`);
      return { success: true, messageId };
    } else {
      const errorMsg = text.match(/<Message>([^<]+)<\/Message>/)?.[1] || text.slice(0, 200);
      console.error(`SES error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    console.error('SES fetch error:', err);
    return { success: false, error: err.message };
  }
}
