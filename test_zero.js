function isZeroPrice(val) {
  if (!val) return true;
  const str = String(val).trim();
  if (/on request|request/i.test(str)) return true;
  const num = Number(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return true;
  if (/^₹?\s*0+(\.0+)?\s*(lakh|cr|crore|lac)?$/i.test(str)) return true;
  return false;
}
console.log('isZeroPrice("₹0.0 Lakh"):', isZeroPrice('₹0.0 Lakh'));
console.log('isZeroPrice("₹0 Lakh"):', isZeroPrice('₹0 Lakh'));
console.log('isZeroPrice("₹1.5 Lakh"):', isZeroPrice('₹1.5 Lakh'));
