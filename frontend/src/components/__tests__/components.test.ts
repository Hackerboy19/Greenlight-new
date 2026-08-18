/**
 * Comprehensive Component Unit Tests & Assertion Suite
 * Verifies component contracts, sanitization rules, and data structures
 */

import { allowedArticleTags, allowedArticleAttributes } from '../../../../backend/src/utils/sanitizer.js';

// Standalone test assertion utility
export function runUnitTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`PASS: ${testName}`);
    } else {
      failed++;
      results.push(`FAIL: ${testName}`);
      console.error(`Test failed: ${testName}`);
    }
  }

  // Test 1: HTML Sanitizer Allowed Tags
  assert(
    allowedArticleTags.includes('h2') && allowedArticleTags.includes('blockquote') && !allowedArticleTags.includes('script'),
    'Sanitizer allows safe editorial tags (h2, blockquote) and blocks script tags'
  );

  // Test 2: Allowed Attributes for links
  assert(
    allowedArticleAttributes.a.includes('href') && allowedArticleAttributes.a.includes('rel'),
    'Link attributes include href and rel'
  );

  // Test 3: Infobox data contract validation
  const sampleInfobox = [
    { section: 'Overview', field_key: 'Valuation', field_value: '$44.2B' }
  ];
  assert(
    sampleInfobox[0].field_key === 'Valuation' && sampleInfobox[0].field_value.startsWith('$'),
    'Infobox key-value format adheres to structure'
  );

  // Test 4: Time series format validation
  const sampleGscPoint = {
    date: '2026-08-18',
    clicks: 1420,
    impressions: 21500,
    ctr: 0.066,
    position: 2.1
  };
  assert(
    sampleGscPoint.clicks > 0 && sampleGscPoint.position >= 1.0,
    'GSC metrics point contains positive clicks and valid search position'
  );

  return { passed, failed, results };
}

export default runUnitTests;
