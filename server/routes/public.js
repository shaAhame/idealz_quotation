// server/routes/public.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { generatePDF } = require('../lib/pdf');

router.get('/:token', async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { downloadToken: req.params.token } });
    if (!q) return res.status(404).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Quotation not found</h2></body></html>`);
    if (q.status === 'SENT') {
      prisma.quotation.update({ where: { id: q.id }, data: { status: 'VIEWED' } }).catch(() => { });
    }
    const pdf = await generatePDF(q);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iDealz-Quotation-${q.globalNum}.pdf"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'no-store',
    });
    res.send(pdf);
  } catch (e) {
    console.error('Public PDF error:', e);
    res.status(500).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Error generating PDF</h2><p>${e.message}</p></body></html>`);
  }
});

module.exports = router;