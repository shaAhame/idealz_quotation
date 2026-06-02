// server/lib/pdf.js
const puppeteer = require('puppeteer');
const { calcTax, TAX_LABELS } = require('./tax');
const fs = require('fs');
const path = require('path');

const BRANCHES = {
  Prime:   { addr: 'No. 86, Galle Road, Colombo 04',   wa: '0777243243', ph: '0112556565', maps: 'https://maps.google.com/?q=iDealz+Prime+Galle+Road+Colombo' },
  Marino:  { addr: '590-9A, Marino Mall, Colombo 03',   wa: '0777656565', ph: '0112585758', maps: 'https://maps.google.com/?q=Marino+Mall+Colombo' },
  Liberty: { addr: '01-64, Liberty Plaza, Colombo 03',  wa: '0777655565', ph: '0112575357', maps: 'https://maps.google.com/?q=Liberty+Plaza+Colombo' },
};

function fmtNum(n) { return n.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'); }
function fmtRs(v) { return 'Rs. ' + parseFloat(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function getLogoTag() {
  const logoPaths = [
    path.join(__dirname, '../../client/public/logo.png'),
    path.join(__dirname, '../../client/dist/logo.png'),
    path.join(__dirname, '../public/logo.png'),
  ];
  for (const p of logoPaths) {
    try {
      if (fs.existsSync(p)) {
        const b64 = fs.readFileSync(p).toString('base64');
        return `<img src="data:image/png;base64,${b64}" alt="iDealz" style="width:155px;height:auto;display:block">`;
      }
    } catch {}
  }
  return `<div style="font-size:26px;font-weight:900;letter-spacing:-1px;color:#000">iDealz</div>`;
}

function buildHTML(q) {
  const b = BRANCHES[q.branch] || BRANCHES.Prime;
  const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;
  const sub = q.subTotal;
  const { sscl, vat, total } = calcTax(sub, q.taxMode);
  const tl = TAX_LABELS[q.taxMode];
  const logoTag = getLogoTag();
  const isCommon = !q.quotationType || q.quotationType === 'COMMON';

  const wa  = (num, disp) => `<a href="https://wa.me/94${num.replace(/^0/,'')}" style="color:#111;text-decoration:none;font-weight:700">${disp}</a>`;
  const tel = (num, disp) => `<a href="tel:${num}" style="color:#444;text-decoration:none">${disp}</a>`;

  const branchCell = (name, addr, waNum, phNum, maps, isLast) => `
    <td style="text-align:center;padding:6px 4px;color:#444;vertical-align:top;font-size:9px;${!isLast ? 'border-right:0.5px solid #ddd;' : ''}">
      <div style="font-weight:700;font-size:10px;margin-bottom:2px">iDealz ${name}</div>
      <div style="margin-bottom:2px">${addr}</div>
      <div style="margin-bottom:2px">${wa(waNum,fmtNum(waNum))} | ${tel(phNum,fmtNum(phNum))}</div>
      <a href="${maps}" style="color:#666;font-size:8px;text-decoration:none">View on Google Maps</a>
    </td>`;

  const footerBranches = isCommon
    ? `<table style="width:100%;border-collapse:collapse;margin-bottom:7px"><tr>
        ${branchCell('Prime',       'No. 86, Galle Road, Colombo 04',   '0777243243','0112556565','https://maps.google.com/?q=iDealz+Prime+Galle+Road+Colombo', false)}
        ${branchCell('Marino Mall', '590-9A, Marino Mall, Colombo 03',  '0777656565','0112585758','https://maps.google.com/?q=Marino+Mall+Colombo', false)}
        ${branchCell('Liberty Plaza','01-64, Liberty Plaza, Colombo 03','0777655565','0112575357','https://maps.google.com/?q=Liberty+Plaza+Colombo', true)}
      </tr></table>`
    : `<table style="width:100%;border-collapse:collapse;margin-bottom:7px"><tr>
        <td style="text-align:center;padding:6px;color:#444;vertical-align:top;font-size:10px">
          <div style="font-weight:700;font-size:11px;margin-bottom:3px">iDealz ${q.branch}</div>
          <div style="margin-bottom:3px">${b.addr}</div>
          <div style="margin-bottom:3px">${wa(b.wa,fmtNum(b.wa))} | ${tel(b.ph,fmtNum(b.ph))}</div>
          <a href="${b.maps}" style="color:#666;font-size:9px;text-decoration:none">View on Google Maps</a>
        </td>
      </tr></table>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:22px;font-size:12px}
  @page{size:A4;margin:8mm}
</style>
</head><body>

<!-- HEADER -->
<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tr>
  <td style="vertical-align:top;width:260px;padding-right:20px">
    <div style="background:#ffffff;display:inline-block;line-height:0">
      ${logoTag}
    </div>
    <div style="font-size:9px;color:#666;letter-spacing:1px;text-transform:uppercase;margin-top:5px">The future's bright</div>
  </td>
  <td style="vertical-align:top;text-align:right">
    <div style="border:2.5px solid #000;display:inline-block;padding:6px 20px;font-size:20px;font-weight:900;letter-spacing:3px;margin-bottom:8px">QUOTATION</div>
    <div style="font-size:11px;color:#444;line-height:2.1">
      <div><b>Quotation #</b> ${q.globalNum}</div>
      <div><b>Date:</b> ${new Date(q.createdAt).toLocaleDateString('en-GB')}</div>
      <div><b>Branch:</b> iDealz ${q.branch}</div>
    </div>
  </td>
</tr></table>

<!-- BILL TO -->
<div style="border-top:2.5px solid #000;border-bottom:0.5px solid #ccc;padding:10px 0;margin-bottom:13px">
  <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Bill to</div>
  <table style="border-collapse:collapse;width:100%">
    <tr>
      <td style="font-size:11px;color:#888;padding-right:16px;padding-bottom:4px;white-space:nowrap;vertical-align:top;width:120px">Company / Name</td>
      <td style="font-size:13px;font-weight:700;color:#111;padding-bottom:4px">${q.clientName}</td>
    </tr>
    ${q.clientAddr ? `<tr>
      <td style="font-size:11px;color:#888;padding-right:16px;padding-bottom:4px;white-space:nowrap;vertical-align:top">Address</td>
      <td style="font-size:11px;color:#333;padding-bottom:4px">${q.clientAddr}</td>
    </tr>` : ''}
    ${q.clientPhone ? `<tr>
      <td style="font-size:11px;color:#888;padding-right:16px;padding-bottom:4px;white-space:nowrap">Phone</td>
      <td style="font-size:11px;color:#333;padding-bottom:4px">${q.clientPhone}</td>
    </tr>` : ''}
    <tr>
      <td style="font-size:11px;color:#888;padding-right:16px;white-space:nowrap">Email</td>
      <td style="font-size:11px;color:#333"><a href="mailto:${q.clientEmail}" style="color:#333;text-decoration:none">${q.clientEmail}</a></td>
    </tr>
  </table>
</div>

<!-- ITEMS TABLE -->
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:13px">
<thead><tr>
  <th style="background:#111;color:#fff;padding:7px 8px;text-align:center;width:44px;font-weight:700">QTY</th>
  <th style="background:#111;color:#fff;padding:7px 8px;text-align:left;font-weight:700">DESCRIPTION</th>
  <th style="background:#111;color:#fff;padding:7px 8px;text-align:right;width:115px;font-weight:700">UNIT PRICE</th>
  <th style="background:#111;color:#fff;padding:7px 8px;text-align:right;width:115px;font-weight:700">TOTAL</th>
</tr></thead>
<tbody>
${items.map((it, i) => `
<tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}">
  <td style="padding:7px 8px;text-align:center;border-bottom:0.5px solid #ddd">${it.qty}</td>
  <td style="padding:7px 8px;border-bottom:0.5px solid #ddd">${it.desc}</td>
  <td style="padding:7px 8px;text-align:right;border-bottom:0.5px solid #ddd">${Number(it.price).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
  <td style="padding:7px 8px;text-align:right;border-bottom:0.5px solid #ddd;font-weight:600">${Number(it.total).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
</tr>`).join('')}
</tbody></table>

<!-- PAYMENT + TOTALS -->
<table style="width:100%;border-collapse:collapse;margin-bottom:13px"><tr>
  <td style="vertical-align:top;font-size:10px;color:#444;padding-right:20px">
    <div style="font-weight:700;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Payment Details</div>
    <table style="border-collapse:collapse">
      <tr><td style="font-size:10px;color:#888;padding:2px 12px 2px 0;white-space:nowrap">Account Name</td><td style="font-size:10px;color:#333;padding:2px 0;font-weight:600">IDEALZ LANKA (PVT) LIMITED</td></tr>
      <tr><td style="font-size:10px;color:#888;padding:2px 12px 2px 0;white-space:nowrap">Account No</td><td style="font-size:10px;color:#333;padding:2px 0">0010428116001</td></tr>
      <tr><td style="font-size:10px;color:#888;padding:2px 12px 2px 0;white-space:nowrap">Bank</td><td style="font-size:10px;color:#333;padding:2px 0">AMANA BANK</td></tr>
      <tr><td style="font-size:10px;color:#888;padding:2px 12px 2px 0;white-space:nowrap">Branch</td><td style="font-size:10px;color:#333;padding:2px 0">PETTAH</td></tr>
      <tr><td style="font-size:10px;color:#888;padding:2px 12px 2px 0;white-space:nowrap">SWIFT Code</td><td style="font-size:10px;color:#333;padding:2px 0">AMNALKLX</td></tr>
    </table>
  </td>
  <td style="vertical-align:bottom;text-align:right;min-width:210px">
    <table style="width:100%;font-size:11px;border-collapse:collapse">
      <tr><td style="padding:4px 8px;color:#555">Sub Total</td><td style="padding:4px 8px;text-align:right">${fmtRs(sub)}</td></tr>
      ${q.taxMode === 'VAT18_SSCL25' ? `<tr><td style="padding:4px 8px;color:#555">SSCL 2.5%</td><td style="padding:4px 8px;text-align:right">${fmtRs(sscl)}</td></tr>` : ''}
      ${(q.taxMode === 'VAT18' || q.taxMode === 'VAT18_SSCL25') ? `<tr><td style="padding:4px 8px;color:#555">VAT 18%</td><td style="padding:4px 8px;text-align:right">${fmtRs(vat)}</td></tr>` : ''}
      ${q.taxMode === 'FLAT205' ? `<tr><td style="padding:4px 8px;color:#555">Tax 20.5%</td><td style="padding:4px 8px;text-align:right">${fmtRs(total - sub)}</td></tr>` : ''}
      ${q.taxMode === 'VAT_INCLUSIVE' ? `<tr><td style="padding:4px 8px;color:#555">Incl. VAT</td><td style="padding:4px 8px;text-align:right">${fmtRs(vat)}</td></tr>` : ''}
      <tr><td colspan="2" style="padding:2px 0"></td></tr>
      <tr><td colspan="2" style="padding:0">
        <table style="width:100%;background:#111;color:#fff;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:700;font-size:14px">TOTAL</td><td style="padding:8px;text-align:right;font-weight:700;font-size:14px">${fmtRs(total)}</td></tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr></table>

${q.notes ? `<div style="border:0.5px solid #ccc;padding:9px 11px;font-size:10px;color:#555;margin-bottom:12px;border-radius:3px"><b>Notes:</b> ${q.notes}</div>` : ''}

<!-- TERMS -->
<div style="border:0.5px solid #ccc;padding:10px 12px;font-size:10px;color:#555;margin-bottom:13px;border-radius:3px">
  <div style="font-weight:700;margin-bottom:6px;font-size:11px">Terms &amp; Conditions</div>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="vertical-align:top;padding-right:6px;padding-bottom:3px">•</td><td style="padding-bottom:3px;line-height:1.5">This quotation is valid only on the date of issue.</td></tr>
    <tr><td style="vertical-align:top;padding-right:6px;padding-bottom:3px">•</td><td style="padding-bottom:3px;line-height:1.5">Subject to availability of stock.</td></tr>
    <tr><td style="vertical-align:top;padding-right:6px;padding-bottom:3px">•</td><td style="padding-bottom:3px;line-height:1.5">Goods will be dispatched only after cheque realisation.</td></tr>
    <tr><td style="vertical-align:top;padding-right:6px">•</td><td style="line-height:1.5">Please write cheques in favour of <b>"iDealz Lanka (Pvt) Limited"</b>.</td></tr>
  </table>
</div>

<!-- FOOTER -->
<div style="border-top:0.5px solid #ccc;padding-top:9px">
  ${footerBranches}
  <div style="text-align:center;font-size:10px;color:#555;margin-bottom:3px">
    <a href="https://www.instagram.com/idealzlanka" style="color:#111;text-decoration:none;margin:0 6px">Instagram</a>
    <a href="https://www.facebook.com/iDealz9191" style="color:#111;text-decoration:none;margin:0 6px">Facebook</a>
    <a href="https://www.tiktok.com/@idealzlanka" style="color:#111;text-decoration:none;margin:0 6px">TikTok</a>
    &nbsp;|&nbsp; <a href="mailto:info@idealz.lk" style="color:#111;text-decoration:none">info@idealz.lk</a>
    &nbsp;|&nbsp; <a href="https://www.idealz.lk" style="color:#111;text-decoration:none">www.idealz.lk</a>
  </div>
  <div style="text-align:center;font-size:9px;color:#aaa">
    ** System Generated Quotation &nbsp;|&nbsp; Best Prices Today Only &nbsp;|&nbsp; Stock Subject to Availability
  </div>
</div>

</body></html>`;
}

async function generatePDF(q) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-zygote','--single-process'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHTML(q), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', bottom: '8mm', left: '10mm', right: '10mm' },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF, buildHTML };
