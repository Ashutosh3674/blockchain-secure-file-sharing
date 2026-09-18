/**
 * test_notifications.cjs
 * Comprehensive validation script for 🔔 Notifications:
 * Verifies all 4 canonical notification scenarios:
 * 1. 🔔 "Rahul shared a file with you."
 * 2. 🔔 "Your access to Report.pdf expires tomorrow."
 * 3. 🔔 "Your file was downloaded."
 * 4. 🔔 "Access to Project.pdf was revoked."
 */

const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  console.log('🧪 ========================================================');
  console.log('🧪 TESTING NOTIFICATION SYSTEM: 4 CANONICAL SCENARIOS');
  console.log('🧪 ========================================================\n');

  // 1. Fetch initial notifications
  console.log('▶️ Test 1: Fetching active notifications via GET /api/files/notifications ...');
  const getRes = await request('http://localhost:5000/api/files/notifications');
  if (getRes.status !== 200 || !getRes.data.success) {
    throw new Error(`Failed to fetch notifications: ${JSON.stringify(getRes)}`);
  }
  console.log(`✅ Retrieved ${getRes.data.count} notifications (${getRes.data.unreadCount} unread).`);

  // Verify the 4 exact canonical notifications are present
  const requiredMessages = [
    'Rahul shared a file with you.',
    'Your access to Report.pdf expires tomorrow.',
    'Your file was downloaded.',
    'Access to Project.pdf was revoked.',
  ];

  requiredMessages.forEach((msg, idx) => {
    const found = getRes.data.notifications.find((n) => n.message === msg);
    if (!found) {
      throw new Error(`Missing canonical notification #${idx + 1}: "${msg}"`);
    }
    console.log(`   ✅ Scenario #${idx + 1} Verified: "🔔 ${found.message}" (Type: ${found.type})`);
  });

  // 2. Trigger a real-time notification push for "Rahul shared a file with you."
  console.log('\n▶️ Test 2: Pushing new notification: "Rahul shared a file with you." ...');
  const post1 = await request('http://localhost:5000/api/files/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'file_shared',
      message: 'Rahul shared a file with you.',
      fileName: 'Project_Alpha_Blueprint.pdf',
      actor: 'Rahul (0x3C44...93BC)',
      severity: 'info',
    },
  });
  if (post1.status !== 201 || !post1.data.notification) {
    throw new Error(`Failed to post notification: ${JSON.stringify(post1)}`);
  }
  console.log(`✅ Push successful! Notification ID: ${post1.data.notification.id}`);

  // 3. Trigger a real-time notification push for "Your access to Report.pdf expires tomorrow."
  console.log('\n▶️ Test 3: Pushing new notification: "Your access to Report.pdf expires tomorrow." ...');
  const post2 = await request('http://localhost:5000/api/files/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'access_expiring',
      message: 'Your access to Report.pdf expires tomorrow.',
      fileName: 'Report.pdf',
      actor: 'Smart Contract Guard',
      severity: 'warning',
    },
  });
  if (post2.status !== 201) throw new Error('Failed to post expiry notification');
  console.log(`✅ Push successful: "${post2.data.notification.message}"`);

  // 4. Trigger a real-time notification push for "Your file was downloaded."
  console.log('\n▶️ Test 4: Pushing new notification: "Your file was downloaded." ...');
  const post3 = await request('http://localhost:5000/api/files/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'file_downloaded',
      message: 'Your file was downloaded.',
      fileName: 'Quarterly_Security_Audit.pdf',
      actor: 'Rahul (Authorized Recipient)',
      severity: 'success',
    },
  });
  if (post3.status !== 201) throw new Error('Failed to post download notification');
  console.log(`✅ Push successful: "${post3.data.notification.message}"`);

  // 5. Trigger a real-time notification push for "Access to Project.pdf was revoked."
  console.log('\n▶️ Test 5: Pushing new notification: "Access to Project.pdf was revoked." ...');
  const post4 = await request('http://localhost:5000/api/files/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'access_revoked',
      message: 'Access to Project.pdf was revoked.',
      fileName: 'Project.pdf',
      actor: 'Ashutosh (Owner)',
      severity: 'danger',
    },
  });
  if (post4.status !== 201) throw new Error('Failed to post revocation notification');
  console.log(`✅ Push successful: "${post4.data.notification.message}"`);

  console.log('\n🎉 ALL 4 NOTIFICATION SCENARIOS VALIDATED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
