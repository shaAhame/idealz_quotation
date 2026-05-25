// server/lib/tax.js
function calcTax(sub, taxMode) {
  let sscl = 0, vat = 0, total = sub;
  switch (taxMode) {
    case 'VAT18':       vat = sub * 0.18;  total = sub + vat; break;
    case 'NO_TAX':      total = sub; break;
    case 'VAT18_SSCL25': sscl = sub * 0.025; vat = (sub + sscl) * 0.18; total = sub + sscl + vat; break;
    case 'FLAT205':     total = sub * 1.205; break;
    case 'VAT_INCLUSIVE': total = sub; vat = sub - sub / 1.18; break;
  }
  return { sscl, vat, total };
}

const TAX_LABELS = {
  VAT18: 'VAT 18%',
  NO_TAX: 'No Tax',
  VAT18_SSCL25: 'VAT 18% + SSCL 2.5%',
  FLAT205: '20.5% Flat Tax',
  VAT_INCLUSIVE: 'VAT Inclusive'
};

module.exports = { calcTax, TAX_LABELS };
