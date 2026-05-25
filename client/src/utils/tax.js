// client/src/utils/tax.js
export const TAX_MODES = [
  { id: 'VAT18',         label: 'VAT 18%',     pct: 'Standard',    desc: 'VAT 18% added on top of net amount.' },
  { id: 'NO_TAX',        label: 'No Tax',       pct: '0%',          desc: 'No tax applied — net price only.' },
  { id: 'VAT18_SSCL25',  label: 'VAT + SSCL',  pct: '18% + 2.5%',  desc: 'SSCL 2.5% applied first on net, then VAT 18% on (net + SSCL).' },
  { id: 'FLAT205',       label: '20.5% Flat',  pct: 'Combined',    desc: '20.5% flat tax applied on net amount.' },
  { id: 'VAT_INCLUSIVE', label: 'Incl. VAT',   pct: 'Price incl.', desc: 'Price entered already includes VAT — broken out on quotation.' },
];

export const TAX_LABELS = {
  VAT18: 'VAT 18%',
  NO_TAX: 'No Tax',
  VAT18_SSCL25: 'VAT 18% + SSCL 2.5%',
  FLAT205: '20.5% Flat Tax',
  VAT_INCLUSIVE: 'VAT Inclusive',
};

export function calcTax(sub, mode) {
  let sscl = 0, vat = 0, total = sub;
  switch (mode) {
    case 'VAT18':         vat = sub * 0.18; total = sub + vat; break;
    case 'NO_TAX':        total = sub; break;
    case 'VAT18_SSCL25':  sscl = sub * 0.025; vat = (sub + sscl) * 0.18; total = sub + sscl + vat; break;
    case 'FLAT205':       total = sub * 1.205; break;
    case 'VAT_INCLUSIVE': total = sub; vat = sub - sub / 1.18; break;
    default:              total = sub;
  }
  return { sscl, vat, total };
}

export function fmtRs(v) {
  return 'Rs. ' + parseFloat(v || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB');
}
