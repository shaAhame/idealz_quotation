// server/routes/public.js — no auth required, for client download links
const router = require('express').Router();
const prisma  = require('../lib/prisma');
const { generatePDF } = require('../lib/pdf');

// GET /download/:token  — client download page (no login needed)
router.get('/:token', async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({
      where: { downloadToken: req.params.token },
    });
    if (!q) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>Quotation not found</h2>
          <p style="color:#888">This link may be invalid or expired.</p>
        </body></html>`);
    }
    // Auto-mark as viewed
    if (q.status === 'SENT') {
      prisma.quotation.update({ where: { id: q.id }, data: { status: 'VIEWED' } }).catch(() => {});
    }
    const pdf = await generatePDF(q);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iDealz-Quotation-${q.globalNum}.pdf"`,
      'Cache-Control': 'no-store',
    });
    res.send(pdf);
  } catch (e) {
    console.error('PDF download error:', e);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Error generating PDF</h2>
        <p style="color:#888">Please contact iDealz directly.</p>
      </body></html>`);
  }
});

module.exports = router;
