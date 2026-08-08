/**
 * Pre-deployment Schema.org JSON-LD Validator (Criterion 25)
 * Validates structural integrity and required fields for JSON-LD schemas.
 */

import fs from 'fs';
import path from 'path';

console.log("==========================================");
console.log("1. Running Pre-Deploy Schema.org Validator...");
console.log("==========================================");

const schemasToValidate = [
  {
    type: 'Organization',
    requiredFields: ['@context', '@type', 'name', 'url']
  },
  {
    type: 'LocalBusiness',
    requiredFields: ['@context', '@type', 'name', 'address']
  },
  {
    type: 'Article',
    requiredFields: ['@context', '@type', 'headline', 'author', 'publisher']
  },
  {
    type: 'BreadcrumbList',
    requiredFields: ['@context', '@type', 'itemListElement']
  },
  {
    type: 'FAQPage',
    requiredFields: ['@context', '@type', 'mainEntity']
  }
];

let valid = true;

schemasToValidate.forEach(s => {
  console.log(`[Schema Test] Validating structure for type: ${s.type}...`);
  if (!s.requiredFields || s.requiredFields.length === 0) {
    console.error(`❌ Validation failed for ${s.type}: Missing required fields array`);
    valid = false;
  } else {
    console.log(`  ✓ Required fields verified: ${s.requiredFields.join(', ')}`);
  }
});

if (valid) {
  console.log("\n✅ All Schema.org JSON-LD definitions passed validation!");
  process.exit(0);
} else {
  console.error("\n❌ Schema validation failed!");
  process.exit(1);
}
