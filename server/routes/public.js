// server/routes/public.js
const router = require('express').Router();
const prisma = require('../lib/prisma');

// Download page — generates PDF in browser using jsPDF (no server timeout)
router.get('/:token', async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { downloadToken: req.params.token } });
    if (!q) return res.status(404).send('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Quotation not found</h2></body></html>');

    if (q.status === 'SENT') {
      prisma.quotation.update({ where: { id: q.id }, data: { status: 'VIEWED' } }).catch(() => {});
    }

    const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;

    // Calculate tax
    let sscl = 0, vat = 0, total = q.subTotal;
    if (q.taxMode === 'VAT18') { vat = q.subTotal * 0.18; total = q.subTotal + vat; }
    else if (q.taxMode === 'VAT18_SSCL25') { sscl = q.subTotal * 0.025; vat = (q.subTotal + sscl) * 0.18; total = q.subTotal + sscl + vat; }
    else if (q.taxMode === 'FLAT205') { total = q.subTotal * 1.205; }
    else if (q.taxMode === 'VAT_INCLUSIVE') { total = q.subTotal; vat = q.subTotal - q.subTotal / 1.18; }

    const TAX_LABELS = { VAT18:'VAT 18%', NO_TAX:'No Tax', VAT18_SSCL25:'VAT 18% + SSCL 2.5%', FLAT205:'20.5% Flat Tax', VAT_INCLUSIVE:'VAT Inclusive' };
    const BRANCHES = {
      Prime:   { addr: 'No. 86, Galle Road, Colombo 04',   wa: '0777243243', ph: '0112556565', waD: '0777 243 243', phD: '0112 556 565' },
      Marino:  { addr: '590-9A, Marino Mall, Colombo 03',   wa: '0777656565', ph: '0112585758', waD: '0777 656 565', phD: '0112 585 758' },
      Liberty: { addr: '01-64, Liberty Plaza, Colombo 03',  wa: '0777655565', ph: '0112575357', waD: '0777 655 565', phD: '0112 575 357' },
    };
    const b = BRANCHES[q.branch] || BRANCHES.Prime;
    const isCommon = !q.quotationType || q.quotationType === 'COMMON';
    const fmtRs = v => 'Rs. ' + parseFloat(v||0).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2});

    res.set('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quotation #${q.globalNum} - iDealz</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f2f2f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:12px;padding:40px 36px;max-width:420px;width:100%;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center}
    .logo{font-size:28px;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:4px}
    .tagline{font-size:10px;color:#999;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
    .title{font-size:18px;font-weight:600;color:#111;margin-bottom:8px}
    .sub{font-size:13px;color:#888;margin-bottom:4px}
    .total{font-size:24px;font-weight:700;color:#111;margin:16px 0 28px}
    .btn{display:block;background:#111;color:#fff;border:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;width:100%;cursor:pointer;font-family:inherit}
    .btn:hover{background:#333}
    .btn:disabled{background:#999;cursor:wait}
    .note{font-size:11px;color:#bbb;margin-top:12px}
    .divider{height:1px;background:#f0f0f0;margin:24px 0}
    .footer{font-size:11px;color:#888}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">iDealz</div>
    <div class="tagline">The Future's Bright</div>
    <div class="title">Quotation #${q.globalNum}</div>
    <div class="sub">iDealz ${q.branch} &nbsp;·&nbsp; ${new Date(q.createdAt).toLocaleDateString('en-GB')}</div>
    <div class="sub">Prepared for <strong>${q.clientName}</strong></div>
    <div class="total">${fmtRs(total)}</div>
    <button class="btn" id="dlBtn" onclick="generatePDF()">⬇ Download PDF</button>
    <div class="note" id="note">Generating your PDF...</div>
    <div class="divider"></div>
    <div class="footer">iDealz Lanka (Pvt) Limited &nbsp;|&nbsp; info@idealz.lk &nbsp;|&nbsp; www.idealz.lk</div>
  </div>

<script>
const q = ${JSON.stringify({
  globalNum: q.globalNum,
  branch: q.branch,
  clientName: q.clientName,
  clientAddr: q.clientAddr,
  clientPhone: q.clientPhone,
  clientEmail: q.clientEmail,
  taxMode: q.taxMode,
  quotationType: q.quotationType,
  subTotal: q.subTotal,
  notes: q.notes,
  createdAt: q.createdAt,
  items,
  vat, sscl, total,
})};

const BRANCHES = {
  Prime:   { addr: 'No. 86, Galle Road, Colombo 04',   waD: '0777 243 243', phD: '0112 556 565' },
  Marino:  { addr: '590-9A, Marino Mall, Colombo 03',   waD: '0777 656 565', phD: '0112 585 758' },
  Liberty: { addr: '01-64, Liberty Plaza, Colombo 03',  waD: '0777 655 565', phD: '0112 575 357' },
};
const TAX_LABELS = { VAT18:'VAT 18%', NO_TAX:'No Tax', VAT18_SSCL25:'VAT 18% + SSCL 2.5%', FLAT205:'20.5% Flat Tax', VAT_INCLUSIVE:'VAT Inclusive' };

function fmtRs(v) {
  return 'Rs. ' + parseFloat(v||0).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function generatePDF() {
  const btn = document.getElementById('dlBtn');
  const note = document.getElementById('note');
  btn.disabled = true;
  btn.textContent = 'Generating...';
  note.textContent = 'Please wait...';

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const b = BRANCHES[q.branch] || BRANCHES.Prime;
    const isCommon = !q.quotationType || q.quotationType === 'COMMON';
    const W = 190;
    const ML = 10;
    let y = 15;

    // Logo text
    doc.setFontSize(20).setFont('helvetica','bold').setTextColor(0,0,0);
    doc.text('iDealz', ML, y);
    doc.setFontSize(7).setFont('helvetica','normal').setTextColor(120,120,120);
    doc.text("THE FUTURE'S BRIGHT", ML, y+5);

    // Branch info
    doc.setFontSize(8).setFont('helvetica','bold').setTextColor(50,50,50);
    doc.text(b.addr, ML, y+11);
    doc.setFont('helvetica','normal').setTextColor(100,100,100);
    doc.text(b.waD + '  |  ' + b.phD, ML, y+16);
    doc.text('info@idealz.lk  |  www.idealz.lk', ML, y+21);

    // QUOTATION box
    doc.setDrawColor(0).setLineWidth(0.6);
    doc.rect(130, y-6, 70, 12);
    doc.setFontSize(14).setFont('helvetica','bold').setTextColor(0,0,0);
    doc.text('QUOTATION', 165, y+1, {align:'center'});

    doc.setFontSize(8.5).setFont('helvetica','normal').setTextColor(80,80,80);
    doc.text('Quotation #  ' + q.globalNum, 200, y+10, {align:'right'});
    doc.text('Date:  ' + new Date(q.createdAt).toLocaleDateString('en-GB'), 200, y+15, {align:'right'});
    doc.text('Branch:  iDealz ' + q.branch, 200, y+20, {align:'right'});

    y += 30;

    // Bill To
    doc.setLineWidth(0.6).setDrawColor(0);
    doc.line(ML, y, 200, y);
    y += 4;
    doc.setFontSize(7).setFont('helvetica','normal').setTextColor(150,150,150);
    doc.text('BILL TO', ML, y);
    y += 5;

    const billRows = [
      ['Company / Name', q.clientName],
      q.clientAddr ? ['Address', q.clientAddr] : null,
      q.clientPhone ? ['Phone', q.clientPhone] : null,
      ['Email', q.clientEmail],
    ].filter(Boolean);

    billRows.forEach(([label, val]) => {
      doc.setFontSize(8).setFont('helvetica','normal').setTextColor(150,150,150);
      doc.text(label, ML, y);
      doc.setFont(label === 'Company / Name' ? 'helvetica' : 'helvetica', label === 'Company / Name' ? 'bold' : 'normal').setTextColor(30,30,30);
      doc.text(val, ML+32, y);
      y += 5;
    });

    y += 3;
    doc.setLineWidth(0.3).setDrawColor(180,180,180).line(ML, y, 200, y);
    y += 5;

    // Items table
    doc.autoTable({
      startY: y,
      head: [['QTY','DESCRIPTION','UNIT PRICE','TOTAL']],
      body: q.items.map(it => [
        it.qty,
        it.desc,
        Number(it.price).toLocaleString('en-LK',{minimumFractionDigits:2}),
        Number(it.total).toLocaleString('en-LK',{minimumFractionDigits:2}),
      ]),
      headStyles: { fillColor: [74,74,74], textColor:255, fontStyle:'bold', fontSize:8.5 },
      bodyStyles: { fontSize:8.5, textColor:[30,30,30] },
      alternateRowStyles: { fillColor:[249,249,249] },
      columnStyles: {
        0: { halign:'center', cellWidth:14 },
        1: { cellWidth:100 },
        2: { halign:'right', cellWidth:38 },
        3: { halign:'right', cellWidth:38 },
      },
      margin: { left: ML, right: 10 },
      styles: { lineColor:[220,220,220], lineWidth:0.2 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Payment details
    doc.setFontSize(8.5).setFont('helvetica','bold').setTextColor(50,50,50);
    doc.text('PAYMENT DETAILS', ML, y);
    y += 5;
    const payFields = [
      ['Account Name','IDEALZ LANKA (PVT) LIMITED'],
      ['Account No','0010428116001'],
      ['Bank','AMANA BANK'],
      ['Branch','PETTAH'],
      ['SWIFT Code','AMNALKLX'],
    ];
    payFields.forEach(([label, val]) => {
      doc.setFontSize(8).setFont('helvetica','normal').setTextColor(150,150,150);
      doc.text(label, ML, y);
      doc.setFont('helvetica', label === 'Account Name' ? 'bold' : 'normal').setTextColor(50,50,50);
      doc.text(val, ML+28, y);
      y += 4.5;
    });

    // Totals
    let ty = doc.lastAutoTable.finalY + 8;
    const totals = [
      ['Sub Total', fmtRs(q.subTotal)],
      q.taxMode === 'VAT18_SSCL25' ? ['SSCL 2.5%', fmtRs(q.sscl)] : null,
      (q.taxMode === 'VAT18' || q.taxMode === 'VAT18_SSCL25') ? ['VAT 18%', fmtRs(q.vat)] : null,
      q.taxMode === 'FLAT205' ? ['Tax 20.5%', fmtRs(q.total - q.subTotal)] : null,
      q.taxMode === 'VAT_INCLUSIVE' ? ['Incl. VAT', fmtRs(q.vat)] : null,
    ].filter(Boolean);

    totals.forEach(([label, val]) => {
      doc.setFontSize(8.5).setFont('helvetica','normal').setTextColor(100,100,100);
      doc.text(label, 145, ty);
      doc.setTextColor(30,30,30);
      doc.text(val, 200, ty, {align:'right'});
      ty += 5;
    });

    // Total box
    ty += 2;
    doc.setFillColor(74,74,74).rect(130, ty, 70, 9, 'F');
    doc.setFontSize(10).setFont('helvetica','bold').setTextColor(255,255,255);
    doc.text('TOTAL', 133, ty+6.5);
    doc.text(fmtRs(q.total), 198, ty+6.5, {align:'right'});
    ty += 15;

    y = Math.max(y, ty);

    // Notes
    if (q.notes) {
      doc.setFontSize(8).setFont('helvetica','bold').setTextColor(80,80,80).text('Notes: ', ML, y, {continued:false});
      doc.setFont('helvetica','normal').text('Notes:  ' + q.notes, ML, y);
      y += 8;
    }

    // Terms
    doc.setDrawColor(180).setLineWidth(0.3).rect(ML, y, W, 24);
    y += 5;
    doc.setFontSize(8).setFont('helvetica','bold').setTextColor(50,50,50).text('TERMS & CONDITIONS', ML+2, y);
    y += 4;
    const terms = [
      'This quotation is valid only on the date of issue and subjected to availability of stock.',
      'Please write the cheques in favour of "iDealz Lanka (Pvt) Limited".',
      'Please note that the Goods will be dispatched after the cheque realization only.',
    ];
    doc.setFont('helvetica','normal').setTextColor(100,100,100);
    terms.forEach(t => { doc.setFontSize(7.5).text('•  ' + t, ML+2, y); y += 4; });
    y += 8;

    // Footer
    doc.setLineWidth(0.3).setDrawColor(200).line(ML, y, 200, y);
    y += 5;

    if (isCommon) {
      const brs = [
        {name:'iDealz Prime', addr:'No. 86, Galle Road, Colombo 04', wa:'0777 243 243', ph:'0112 556 565'},
        {name:'iDealz Marino Mall', addr:'590-9A, Marino Mall, Colombo 03', wa:'0777 656 565', ph:'0112 585 758'},
        {name:'iDealz Liberty Plaza', addr:'01-64, Liberty Plaza, Colombo 03', wa:'0777 655 565', ph:'0112 575 357'},
      ];
      brs.forEach((br, i) => {
        const bx = ML + i * 63;
        doc.setFontSize(7.5).setFont('helvetica','bold').setTextColor(30,30,30).text(br.name, bx+31, y, {align:'center'});
        doc.setFont('helvetica','normal').setTextColor(100,100,100).setFontSize(7);
        doc.text(br.addr, bx+31, y+4, {align:'center'});
        doc.text(br.wa + '  |  ' + br.ph, bx+31, y+8, {align:'center'});
      });
    } else {
      doc.setFontSize(8).setFont('helvetica','bold').setTextColor(30,30,30).text('iDealz ' + q.branch, 105, y, {align:'center'});
      doc.setFont('helvetica','normal').setTextColor(100,100,100).setFontSize(7.5);
      doc.text(b.addr, 105, y+5, {align:'center'});
      doc.text(b.waD + '  |  ' + b.phD, 105, y+10, {align:'center'});
    }

    y += 16;
    doc.setFontSize(7).setFont('helvetica','normal').setTextColor(120,120,120);
    doc.text('Instagram  |  Facebook  |  TikTok  |  info@idealz.lk  |  www.idealz.lk', 105, y, {align:'center'});
    y += 4;
    doc.text('** System Generated Quotation  |  Best Prices Today Only  |  Stock Subject to Availability', 105, y, {align:'center'});

    doc.save('iDealz-Quotation-' + q.globalNum + '.pdf');

    btn.disabled = false;
    btn.textContent = '⬇ Download PDF';
    note.textContent = 'PDF downloaded successfully!';
    note.style.color = '#16a34a';
  } catch(e) {
    console.error(e);
    btn.disabled = false;
    btn.textContent = '⬇ Download PDF';
    note.textContent = 'Error: ' + e.message;
    note.style.color = '#dc2626';
  }
}

// Auto-trigger after load
window.onload = function() {
  setTimeout(generatePDF, 500);
};
</script>
</body>
</html>`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error loading quotation.');
  }
});

module.exports = router;
