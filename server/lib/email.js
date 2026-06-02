// server/lib/email.js
const { TAX_LABELS } = require('./tax');

function fmtRs(v) {
  return 'Rs. ' + parseFloat(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function sendQuotationEmail(q, downloadUrl) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <!-- HEADER -->
  <tr><td style="background:#111111;padding:28px 32px;text-align:center">
    <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px">iDealz</div>
    <div style="font-size:11px;color:#aaaaaa;letter-spacing:2px;text-transform:uppercase;margin-top:4px">The future's bright</div>
  </td></tr>

  <!-- GREETING ONLY -->
  <tr><td style="padding:32px 32px 24px">
    <p style="font-size:15px;color:#222;margin:0 0 16px">Dear <b>${q.clientName}</b>,</p>
    <p style="font-size:14px;color:#555;margin:0 0 8px;line-height:1.7">
      Thank you for your inquiry. Please find your quotation from <b>iDealz ${q.branch}</b> below.
      Click the button to download your quotation as a PDF.
    </p>
  </td></tr>

  <!-- DOWNLOAD BUTTON -->
  <tr><td style="padding:0 32px 32px;text-align:center">
    <a href="${downloadUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 40px;border-radius:4px;font-size:15px;font-weight:700;letter-spacing:0.5px">
      Download Quotation PDF
    </a>
    <div style="margin-top:16px;font-size:11px;color:#999">Or copy this link:</div>
    <div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:3px;padding:10px 12px;font-size:11px;color:#555;font-family:monospace;word-break:break-all;margin-top:6px;text-align:left">
      ${downloadUrl}
    </div>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #eeeeee;margin:0"></td></tr>

  <!-- TERMS & CONDITIONS -->
  <tr><td style="padding:20px 32px">
    <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:10px">Terms &amp; Conditions</div>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="font-size:12px;color:#666;padding:3px 0;vertical-align:top">•&nbsp;</td><td style="font-size:12px;color:#666;padding:3px 0;line-height:1.6">This quotation is valid only on the date of issue.</td></tr>
      <tr><td style="font-size:12px;color:#666;padding:3px 0;vertical-align:top">•&nbsp;</td><td style="font-size:12px;color:#666;padding:3px 0;line-height:1.6">Subject to availability of stock.</td></tr>
      <tr><td style="font-size:12px;color:#666;padding:3px 0;vertical-align:top">•&nbsp;</td><td style="font-size:12px;color:#666;padding:3px 0;line-height:1.6">Goods will be dispatched only after cheque realisation.</td></tr>
      <tr><td style="font-size:12px;color:#666;padding:3px 0;vertical-align:top">•&nbsp;</td><td style="font-size:12px;color:#666;padding:3px 0;line-height:1.6">Please write cheques in favour of <b>"iDealz Lanka (Pvt) Limited"</b>.</td></tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #eeeeee;margin:0"></td></tr>

  <!-- SENDING BRANCH ONLY -->
  <tr><td style="padding:20px 32px">
    <div style="font-size:11px;font-weight:700;color:#333;text-align:center;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase">Contact Us</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="text-align:center;vertical-align:top">
        <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:6px">iDealz ${q.branch}</div>
        <div style="font-size:11px;color:#666;line-height:1.8">
          ${{
            Prime:   'No. 86, Galle Road, Colombo 04',
            Marino:  '590-9A, Marino Mall, Colombo 03',
            Liberty: '01-64, Liberty Plaza, Colombo 03'
          }[q.branch]}<br>
          <a href="https://wa.me/94${{Prime:'777243243',Marino:'777656565',Liberty:'777655565'}[q.branch]}" style="color:#111;text-decoration:none;font-weight:700">${{Prime:'0777 243 243',Marino:'0777 656 565',Liberty:'0777 655 565'}[q.branch]}</a>
          &nbsp;|&nbsp;
          <a href="tel:${{Prime:'0112556565',Marino:'0112585758',Liberty:'0112575357'}[q.branch]}" style="color:#666;text-decoration:none">${{Prime:'0112 556 565',Marino:'0112 585 758',Liberty:'0112 575 357'}[q.branch]}</a>
          <br>
          <a href="mailto:info@idealz.lk" style="color:#555;text-decoration:none">info@idealz.lk</a>
          &nbsp;|&nbsp;
          <a href="https://www.idealz.lk" style="color:#555;text-decoration:none">www.idealz.lk</a>
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#111;padding:16px 32px;text-align:center">
    <div style="font-size:10px;color:#aaa">
      <a href="https://www.instagram.com/idealzlanka" style="color:#aaa;text-decoration:none;margin:0 6px">Instagram</a>
      <a href="https://www.facebook.com/iDealz9191" style="color:#aaa;text-decoration:none;margin:0 6px">Facebook</a>
      <a href="https://www.tiktok.com/@idealzlanka" style="color:#aaa;text-decoration:none;margin:0 6px">TikTok</a>
      &nbsp;|&nbsp;
      <a href="mailto:info@idealz.lk" style="color:#aaa;text-decoration:none">info@idealz.lk</a>
      &nbsp;|&nbsp;
      <a href="https://www.idealz.lk" style="color:#aaa;text-decoration:none">www.idealz.lk</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  // Use Brevo HTTP API
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
