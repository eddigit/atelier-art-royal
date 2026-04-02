// Shared email template wrapper for Atelier Art Royal
// All emails use this consistent layout with logo, header, and footer.

const LOGO_URL = 'https://res.cloudinary.com/dezvsjtz5/image/upload/v1774512031/artroyal/logo.png';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://artroyal.fr';

function emailLayout({ title, body }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#ffffff">
  <!-- Header -->
  <div style="background:#1a1a2e;padding:30px;text-align:center">
    <img src="${LOGO_URL}" alt="Atelier Art Royal" style="height:50px;width:auto;margin-bottom:10px" onerror="this.style.display='none'">
    <h1 style="color:#c9a84c;margin:0;font-size:22px;font-weight:700">${title}</h1>
    <p style="color:#ffffff;margin:5px 0 0;font-size:13px;opacity:0.8">Haute Couture Maçonnique</p>
  </div>
  <!-- Body -->
  <div style="padding:30px;color:#333333;font-size:14px;line-height:1.6">
    ${body}
  </div>
  <!-- Footer -->
  <div style="background:#1a1a2e;padding:24px;text-align:center;font-size:12px;color:#999999">
    <p style="margin:0 0 8px">
      <a href="${SITE_URL}" style="color:#c9a84c;text-decoration:none;font-weight:600">artroyal.fr</a>
    </p>
    <p style="margin:0 0 8px">
      <a href="${SITE_URL}/CGV" style="color:#999999;text-decoration:none;margin:0 8px">CGV</a>
      <span style="color:#555">|</span>
      <a href="${SITE_URL}/Contact" style="color:#999999;text-decoration:none;margin:0 8px">Contact</a>
      <span style="color:#555">|</span>
      <a href="${SITE_URL}/MentionsLegales" style="color:#999999;text-decoration:none;margin:0 8px">Mentions légales</a>
    </p>
    <p style="margin:8px 0 0;color:#666">&copy; ${new Date().getFullYear()} Atelier Art Royal</p>
  </div>
</div>
</body>
</html>`;
}

function goldButton(href, text) {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${href}" style="display:inline-block;background:#c9a84c;color:#1a1a2e;padding:12px 32px;text-decoration:none;font-weight:700;border-radius:4px;font-size:14px">${text}</a>
  </div>`;
}

export { emailLayout, goldButton, LOGO_URL, SITE_URL };
