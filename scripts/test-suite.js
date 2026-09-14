import { generateSecureToken, hashToken, safeEqual } from '../lib/security.js';
import { validateBody, loginSchema, registerSchema, createDocSchema, createGoalSchema } from '../lib/validations.js';
import { isValidWebhookUrl } from '../lib/webhooks.js';
import { rateLimit } from '../lib/rateLimit.js';

async function runTests() {
  console.log('🧪 Starting TaskFlow Automated Production Readiness Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Cryptographic Token & Hash Security Test
  console.log('🔍 Testing Cryptographic Token Generation & Hashing...');
  const token1 = generateSecureToken(32);
  const token2 = generateSecureToken(32);
  assert(token1.length === 64, 'Token 1 is 64 hex characters (32 bytes)');
  assert(token1 !== token2, 'Generated tokens are cryptographically distinct');

  const hash1 = hashToken(token1);
  const hash2 = hashToken(token1);
  assert(hash1 === hash2, 'Token hashing is deterministic');
  assert(hash1 !== token1, 'Token hash is not equal to raw token');
  assert(safeEqual(hash1, hash2), 'Constant-time string comparison validates matching hashes');

  // 2. Input Validation (Zod) Test
  console.log('\n🔍 Testing Zod Input Validation Schemas...');
  const validReg = validateBody(registerSchema, {
    email: 'test@taskflow.dev',
    password: 'securepassword123',
    name: 'Test Admin',
  });
  assert(validReg.error === null && validReg.data !== null, 'Valid registration payload accepted');

  const invalidReg = validateBody(registerSchema, {
    email: 'invalid-email',
    password: '123',
    name: 'A',
  });
  assert(invalidReg.error !== null, 'Invalid email and password rejected with descriptive error');

  const validDoc = validateBody(createDocSchema, {
    workspaceId: 'ws-123',
    title: 'Architecture Blueprint',
    category: 'Engineering',
    content: '# Content',
  });
  assert(validDoc.error === null, 'Doc creation schema validated correctly');

  // 3. Webhook SSRF Security Test
  console.log('\n🔍 Testing Webhook SSRF Security Filter...');
  assert(isValidWebhookUrl('https://hooks.slack.com/services/XXX') === true, 'HTTPS Slack webhook URL allowed');
  assert(isValidWebhookUrl('http://localhost:3000/api/admin') === false, 'HTTP localhost target blocked');
  assert(isValidWebhookUrl('https://127.0.0.1/admin') === false, 'Internal IPv4 target blocked');
  assert(isValidWebhookUrl('https://192.168.1.1/secret') === false, 'Private network 192.168.x.x target blocked');
  assert(isValidWebhookUrl('https://10.0.0.1/internal') === false, 'Private network 10.x.x.x target blocked');

  // 4. Rate Limiter Test
  console.log('\n🔍 Testing Rate Limiting Middleware...');
  const ip = 'test_ip_123';
  let limitBlocked = false;
  for (let i = 0; i < 5; i++) {
    const res = rateLimit({ ip: `test_${ip}`, limit: 3, windowMs: 1000 });
    if (!res.success) {
      limitBlocked = true;
    }
  }
  assert(limitBlocked === true, 'Rate limiter blocks requests exceeding configured threshold');

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL SECURITY & UNIT TESTS PASSED SUCCESSFULLY!\n');
  }
}

runTests().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
