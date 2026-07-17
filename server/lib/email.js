// server/lib/email.js
const { TAX_LABELS } = require('./tax');

function fmtRs(v) {
  return 'Rs. ' + parseFloat(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function sendQuotationEmail(q, downloadUrl) {
  const BRANCH_DATA = {
    Prime:   { addr: 'No. 86, Galle Road, Colombo 04',  wa: '94777243243', waDisp: '0777 243 243', ph: '0112556565', phDisp: '0112 556 565' },
    Marino:  { addr: '590-9A, Marino Mall, Colombo 03',  wa: '94777656565', waDisp: '0777 656 565', ph: '0112585758', phDisp: '0112 585 758' },
    Liberty: { addr: '01-64, Liberty Plaza, Colombo 03', wa: '94777655565', waDisp: '0777 655 565', ph: '0112575357', phDisp: '0112 575 357' },
  };
  const b = BRANCH_DATA[q.branch] || BRANCH_DATA.Prime;
  const tl = TAX_LABELS[q.taxMode];

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:'DM Sans',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0;padding:32px 0">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

  <!-- HEADER -->
  <tr><td style="background:#0f0f0f;padding:30px 32px;text-align:center">
    <div style="font-family:'DM Sans',Arial,sans-serif;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">iDealz</div>
    <div style="display:inline-block;background:#1a1a1a;border:1px solid #333;border-radius:20px;padding:4px 14px;margin-top:8px">
      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#888;letter-spacing:3px;text-transform:uppercase;font-weight:500">The Future's Bright</span>
    </div>
  </td></tr>

  <!-- GREETING -->
  <tr><td style="padding:32px 32px 20px">
    <p style="font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#111;margin:0 0 14px;font-weight:500">Dear <span style="font-weight:700">${q.clientName}</span>,</p>
    <p style="font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#555;margin:0;line-height:1.7">
      Thank you for your inquiry. Please find your quotation from <span style="font-weight:600;color:#111">iDealz ${q.branch}</span> below.
      Click the button to download your quotation as a PDF.
    </p>
  </td></tr>

  <!-- DOWNLOAD BUTTON -->
  <tr><td style="padding:8px 32px 28px;text-align:center">
    <a href="${downloadUrl}" style="display:inline-block;background:#4a4a4a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:6px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.3px">
      Download Quotation PDF
    </a>
    <div style="margin-top:14px">
      <a href="${downloadUrl}" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#4a4a4a;text-decoration:underline">
        Click here if button doesn't work
      </a>
    </div>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px"><div style="height:1px;background:#eeeeec"></div></td></tr>

  <!-- TERMS & CONDITIONS -->
  <tr><td style="padding:22px 32px">
    <div style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:700;color:#111;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.8px">Terms &amp; Conditions</div>
    <table cellpadding="0" cellspacing="0" style="width:100%">
      <tr>
        <td style="font-size:13px;color:#111;padding:4px 8px 4px 0;vertical-align:top;font-weight:700">•</td>
        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#555;padding:4px 0;line-height:1.6">This quotation is valid only on the date of issue and subjected to availability of stock.</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#111;padding:4px 8px 4px 0;vertical-align:top;font-weight:700">•</td>
        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#555;padding:4px 0;line-height:1.6">Please write the cheques in favour of <span style="font-weight:600;color:#111">"iDealz Lanka (Pvt) Limited"</span>.</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#111;padding:4px 8px 4px 0;vertical-align:top;font-weight:700">•</td>
        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#555;padding:4px 0;line-height:1.6">Please note that the Goods will be dispatched after the cheque realization only.</td>
      </tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px"><div style="height:1px;background:#eeeeec"></div></td></tr>

  <!-- BRANCH CONTACT -->
  <tr><td style="padding:22px 32px">
    <div style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:700;color:#111;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.8px">Contact Us</div>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f7f7f5;border-radius:6px;overflow:hidden">
      <tr><td style="padding:16px 20px">
        <div style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:#111;margin-bottom:6px">iDealz ${q.branch}</div>
        <div style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#666;line-height:1.8">
          ${b.addr}<br>
          <a href="https://wa.me/${b.wa}" style="color:#111;text-decoration:none;font-weight:600">${b.waDisp}</a>
          &nbsp;(WhatsApp) &nbsp;|&nbsp;
          <a href="tel:${b.ph}" style="color:#666;text-decoration:none">${b.phDisp}</a><br>
          <a href="mailto:info@idealz.lk" style="color:#555;text-decoration:none">info@idealz.lk</a>
          &nbsp;|&nbsp;
          <a href="https://www.idealz.lk" style="color:#555;text-decoration:none">www.idealz.lk</a>
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0f0f0f;padding:18px 32px;text-align:center">
    <div style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#666">
      <a href="https://www.instagram.com/idealzlanka" style="color:#888;text-decoration:none;margin:0 6px">Instagram</a>
      <a href="https://www.facebook.com/iDealz9191" style="color:#888;text-decoration:none;margin:0 6px">Facebook</a>
      <a href="https://www.tiktok.com/@idealzlanka" style="color:#888;text-decoration:none;margin:0 6px">TikTok</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: `iDealz ${q.branch}`, email: 'info@idealz.lk' },
      to: [{ email: q.clientEmail, name: q.clientName }],
      subject: `Quotation #${q.globalNum} from iDealz ${q.branch} — ${q.clientName}`,
      htmlContent: html,
      trackClicks: false,
      trackOpens: false,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || JSON.stringify(err));
  }

  const result = await response.json();
  console.log('Email sent via Brevo API:', result.messageId);
}

module.exports = { sendQuotationEmail };
