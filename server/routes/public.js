// server/routes/public.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { generatePDF } = require('../lib/pdf');

// Download page — shows a button, auto-triggers download
router.get('/:token', async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { downloadToken: req.params.token } });
    if (!q) {
      return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title>
      <style>body{font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f5f5f5}
      .box{background:#fff;border-radius:8px;padding:40px;max-width:400px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
      </style></head><body><div class="box"><h2>Quotation Not Found</h2><p style="color:#888">This link may be invalid or expired.</p></div></body></html>`);
    }

    // Mark as viewed
    if (q.status === 'SENT') {
      prisma.quotation.update({ where: { id: q.id }, data: { status: 'VIEWED' } }).catch(() => {});
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/download/${q.downloadToken}/pdf`;

    // Return a clean download page that auto-triggers download
    res.set('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quotation #${q.globalNum} - iDealz</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',Arial,sans-serif;background:#f2f2f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:12px;padding:40px 36px;max-width:420px;width:100%;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center}
    .logo{font-size:28px;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:4px}
    .tagline{font-size:10px;color:#999;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
    .title{font-size:18px;font-weight:600;color:#111;margin-bottom:8px}
    .sub{font-size:13px;color:#888;margin-bottom:6px}
    .total{font-size:22px;font-weight:700;color:#111;margin:16px 0 28px}
    .btn{display:block;background:#111;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:12px;cursor:pointer;border:none;width:100%;font-family:'DM Sans',Arial,sans-serif}
    .btn:hover{background:#333}
    .note{font-size:11px;color:#bbb;margin-top:16px}
    .divider{height:1px;background:#f0f0f0;margin:24px 0}
    .branch{font-size:12px;color:#666}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">iDealz</div>
    <div class="tagline">The Future's Bright</div>
    <div class="title">Quotation #${q.globalNum}</div>
    <div class="sub">iDealz ${q.branch} &nbsp;·&nbsp; ${new Date(q.createdAt).toLocaleDateString('en-GB')}</div>
    <div class="sub">Prepared for <strong>${q.clientName}</strong></div>
    <div class="total">Rs. ${parseFloat(q.total).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    <a href="${pdfUrl}" class="btn" id="dlBtn">⬇ Download PDF</a>
    <div class="note">Click the button above to download your quotation as a PDF file.</div>
    <div class="divider"></div>
    <div class="branch">iDealz Lanka (Pvt) Limited &nbsp;|&nbsp; info@idealz.lk &nbsp;|&nbsp; www.idealz.lk</div>
  </div>
  <script>
    // Auto-trigger download after short delay
    setTimeout(function() {
      document.getElementById('dlBtn').click();
    }, 800);
  </script>
</body>
</html>`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error loading quotation. Please try again.');
  }
});

// Actual PDF download endpoint
router.get('/:token/pdf', async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { downloadToken: req.params.token } });
    if (!q) return res.status(404).send('Not found');
    const pdf = await generatePDF(q);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iDealz-Quotation-${q.globalNum}.pdf"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'no-store',
    });
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error generating PDF.');
  }
});

module.exports = router;
