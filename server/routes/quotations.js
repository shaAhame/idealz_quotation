// server/routes/quotations.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const { calcTax } = require('../lib/tax');
const { generatePDF } = require('../lib/pdf');
const { sendQuotationEmail } = require('../lib/email');

async function getNextNum() {
  const counter = await prisma.counter.upsert({
    where: { id: 'global' },
    update: { value: { increment: 1 } },
    create: { id: 'global', value: 1 },
  });
  return counter.value;
}

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, branch, status } = req.query;
    const where = req.user.role === 'ADMIN' ? {} : { branch: req.user.branch };
    if (branch && req.user.role === 'ADMIN') where.branch = branch;
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({ where, skip, take, orderBy: { globalNum: 'desc' }, include: { manager: { select: { name: true } } } }),
      prisma.quotation.count({ where }),
    ]);
    res.json({ quotations, total, page: parseInt(page), pages: Math.ceil(total / take) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { branch: req.user.branch };
    const [total, byBranch, recent] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.groupBy({ by: ['branch'], where, _count: true, _sum: { total: true } }),
      prisma.quotation.findMany({ where, take: 8, orderBy: { createdAt: 'desc' }, include: { manager: { select: { name: true } } } }),
    ]);
    res.json({ total, byBranch, recent });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { clientName, clientAddr, clientEmail, clientPhone, taxMode, items, notes } = req.body;
    if (!clientName || !clientEmail || !taxMode || !Array.isArray(items) || !items.length)
      return res.status(400).json({ error: 'Missing required fields' });
    const sub = items.reduce((s, i) => s + (Number(i.qty) * Number(i.price)), 0);
    const { sscl, vat, total } = calcTax(sub, taxMode);
    const globalNum = await getNextNum();
    const quotation = await prisma.quotation.create({
      data: {
        globalNum, branch: req.user.branch, managerId: req.user.id,
        clientName, clientAddr: clientAddr || null, clientEmail,
        clientPhone: clientPhone || null, taxMode, items,
        subTotal: sub, vatAmount: vat, ssclAmount: sscl, total,
        notes: notes || null, status: 'DRAFT',
      },
      include: { manager: { select: { name: true } } },
    });
    res.json(quotation);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: { manager: { select: { name: true } } } });
    if (!q) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'ADMIN' && q.branch !== req.user.branch) return res.status(403).json({ error: 'Forbidden' });
    res.json(q);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/send', auth, async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!q) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'ADMIN' && q.branch !== req.user.branch) return res.status(403).json({ error: 'Forbidden' });
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/download/${q.downloadToken}`;
    await sendQuotationEmail(q, downloadUrl);
    await prisma.quotation.update({ where: { id: q.id }, data: { status: 'SENT', emailSentAt: new Date() } });
    res.json({ ok: true, downloadUrl });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to send email: ' + e.message }); }
});

router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const q = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: { manager: { select: { name: true } } } });
    if (!q) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'ADMIN' && q.branch !== req.user.branch) return res.status(403).json({ error: 'Forbidden' });
    console.log('Generating PDF for quotation', q.globalNum);
    const pdf = await generatePDF(q);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iDealz-Quotation-${q.globalNum}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  } catch (e) { console.error('PDF error:', e); res.status(500).json({ error: 'PDF generation failed: ' + e.message }); }
});

module.exports = router;