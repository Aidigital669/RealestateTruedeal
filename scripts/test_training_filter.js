const { filterBuyerDemandsByQuery, extractQueryLines } = require('../src/lib/search-training-corpus.ts');

const mockDemands = [
  { locality: 'Baner, Pune', bhk: '3 BHK Apartment', budget: '₹2.50 Cr', requirements: 'Buy 3 BHK in Baner' },
  { locality: 'Wakad, Pune', bhk: '2 BHK Apartment', budget: '₹85 Lakhs', requirements: 'Buy 2 BHK in Wakad' },
  { locality: 'Kharadi, Pune', bhk: 'Commercial Office Space', budget: '₹4.00 Cr', requirements: 'Office in Kharadi' },
  { locality: 'Nana Peth, Pune', bhk: 'Commercial Retail Shop', budget: '₹1.50 Cr', requirements: 'Shop in Nana Peth' },
  { locality: 'Hinjewadi, Pune', bhk: 'Commercial Land / Plot', budget: '₹3.00 Cr', requirements: 'Plot in Hinjewadi' },
  { locality: 'Koregaon Park, Pune', bhk: '4.5+ BHK Penthouse', budget: '₹6.50 Cr', requirements: 'Penthouse in KP' }
];

console.log('Total mock demands:', mockDemands.length);

// Test 1: General seller query
const r1 = filterBuyerDemandsByQuery(mockDemands, 'i need a buyer for my this property');
console.log('Test 1 (General Seller: "i need a buyer for my this property"):', r1.length, 'buyers returned (expected all: 6)');

// Test 2: Commercial shop in Nana Peth
const r2 = filterBuyerDemandsByQuery(mockDemands, 'have commercial shop in nana peth need buyers');
console.log('Test 2 (Commercial Shop Seller):', r2.length, 'buyers returned (expected: 1)');
if (r2[0]) console.log(' -> Match:', r2[0].locality, '|', r2[0].bhk);

// Test 3: 3 BHK in Baner
const r3 = filterBuyerDemandsByQuery(mockDemands, 'need buyers for 3 bhk in baner');
console.log('Test 3 (3 BHK in Baner):', r3.length, 'buyers returned (expected: 1)');
if (r3[0]) console.log(' -> Match:', r3[0].locality, '|', r3[0].bhk);

// Test 4: Office in Kharadi
const r4 = filterBuyerDemandsByQuery(mockDemands, 'have office space in kharadi looking for buyers');
console.log('Test 4 (Office Space in Kharadi):', r4.length, 'buyers returned (expected: 1)');
if (r4[0]) console.log(' -> Match:', r4[0].locality, '|', r4[0].bhk);
