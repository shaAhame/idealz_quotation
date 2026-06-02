// server/lib/email.js
const nodemailer = require('nodemailer');
const { TAX_LABELS } = require('./tax');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });
}

function fmtRs(v) {
  return 'Rs. ' + parseFloat(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function sendQuotationEmail(q, downloadUrl) {
  const transporter = getTransporter();
  const tl = TAX_LABELS[q.taxMode];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden">
  <tr><td style="background:#111111;padding:24px 32px;text-align:center">
    <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px">iDealz</div>
    <div style="font-size:11px;color:#aaaaaa;letter-spacing:2px;text-transform:uppercase;margin-top:4px">The future's bright</div>
  </td></tr>
  <tr><td style="padding:32px">
    <p style="font-size:15px;color:#333;margin:0 0 16px">Dear <b>${q.clientName}</b>,</p>
    <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
      Thank you for your inquiry. Please find your quotation from <b>iDealz ${q.branch}</b> below.
      Click the button to download your quotation as a PDF.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;margin-bottom:24px">
      <tr><td style="padding:16px 20px">
        <table width="100%">
          <tr><td style="font-size:12px;color:#888">Quotation #</td><td style="font-size:13px;font-weight:700;text-align:right;color:#111">${q.globalNum}</td></tr>
          <tr><td style="font-size:12px;color:#888;padding-top:6px">Branch</td><td style="font-size:13px;text-align:right;color:#333;padding-top:6px">iDealz ${q.branch}</td></tr>
          <tr><td style="font-size:12px;color:#888;padding-top:6px">Tax type</td><td style="font-size:13px;text-align:right;color:#333;padding-top:6px">${tl}</td></tr>
          <tr><td style="font-size:12px;color:#888;padding-top:6px">Date</td><td style="font-size:13px;text-align:right;color:#333;padding-top:6px">${new Date(q.createdAt).toLocaleDateString('en-GB')}</td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#111;padding:12px 20px;border-radius:0 0 3px 3px">
        <table width="100%"><tr>
          <td style="font-size:14px;font-weight:700;color:#fff">TOTAL</td>
          <td style="font-size:16px;font-weight:900;color:#fff;text-align:right">${fmtRs(q.total)}</td>
        </tr></table>
      </td></tr>
    </table>
    <div style="text-align:center;margin-bottom:28px">
      <a href="${downloadUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 36px;border-radius:3px;font-size:14px;font-weight:700;letter-spacing:0.5px">
        Download Quotation PDF
      </a>
    </div>
    <p style="font-size:12px;color:#888;margin:0 0 8px">Or copy this link:</p>
    <div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:3px;padding:10px 12px;font-size:11px;color:#555;font-family:monospace;word-break:break-all;margin-bottom:24px">
      ${downloadUrl}
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="font-size:11px;color:#999;margin:0 0 4px">Terms: Valid only on date of issue, subject to availability of stock.</p>
    <p style="font-size:11px;color:#999;margin:0">Goods dispatched after cheque realisation. Cheques in favour of "iDealz Lanka (Pvt) Limited".</p>
  </td></tr>
  <tr><td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eee">
    <table width="100%"><tr>
      <td style="font-size:10px;color:#888;text-align:center">
        <b>iDealz Prime</b>: 0777 243 243 &nbsp;|&nbsp;
        <b>Marino</b>: 0777 656 565 &nbsp;|&nbsp;
        <b>Liberty</b>: 0777 655 565<br>
        <a href="mailto:info@idealz.lk" style="color:#555;text-decoration:none">info@idealz.lk</a> &nbsp;|&nbsp;
        <a href="https://www.idealz.lk" style="color:#555;text-decoration:none">www.idealz.lk</a>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  await transporter.sendMail({
    from: '"iDealz" <info@idealz.lk>',
    to: q.clientEmail,
    subject: `Quotation #${q.globalNum} from iDealz ${q.branch} — ${q.clientName}`,
    html,
  });

  console.log(`Email sent to ${q.clientEmail}`);
}

module.exports = { sendQuotationEmail };
