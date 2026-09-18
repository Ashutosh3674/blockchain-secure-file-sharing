// Test script to verify Private (Default) vs Public Sharing modes & 6-stage gatekeeper
const http = require('http');

function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function putRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getRequest(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 5000, path }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🔒 VERIFYING PRIVATE (DEFAULT) VS PUBLIC SHARING PIPELINE');
  console.log('================================================================\n');

  // Test 1: Verify Initial Default Mode is PRIVATE
  console.log('Test 1: Check Metadata -> Must default to Private mode (isPublic: false)');
  const metaRes = await getRequest('/api/files/share-meta/8f72d9e2');
  const fileMeta = metaRes.data.file || metaRes.data;
  console.log(`Status: ${metaRes.statusCode}, isPublic: ${fileMeta.isPublic}, mode: ${fileMeta.mode}`);
  if (metaRes.statusCode === 200 && fileMeta.isPublic === false) {
    console.log('✅ PASS: Private mode is active by default!\n');
  } else {
    console.error('❌ FAIL: Default is not private', metaRes);
    process.exit(1);
  }

  // Test 2: In Private Mode, Stranger (Amit) MUST be rejected at Stage 4
  console.log('Test 2: Private Mode -> Stranger (Amit) tries to access Report.pdf');
  const amitPrivateRes = await postRequest('/api/files/share-verify', {
    shareToken: '8f72d9e2',
    user: { email: 'amit@stranger.org', name: 'Amit Verma' },
    callerAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  });
  const isAmitBlocked = amitPrivateRes.data.allowed === false || amitPrivateRes.data.isAllowed === false;
  console.log(`Status: ${amitPrivateRes.statusCode}, allowed: ${amitPrivateRes.data.allowed}, failedStage: ${amitPrivateRes.data.failedStage}`);
  if (amitPrivateRes.statusCode === 403 && isAmitBlocked && String(amitPrivateRes.data.failedStage).includes('Stage 4')) {
    console.log('✅ PASS: Stranger (Amit) correctly blocked at Stage 4 (Blockchain Permission) in Private Mode!\n');
  } else {
    console.error('❌ FAIL: Stranger was not blocked at Stage 4', amitPrivateRes);
    process.exit(1);
  }

  // Test 3: In Private Mode, Authorized Recipient (Rahul) MUST be ALLOWED
  console.log('Test 3: Private Mode -> Authorized Recipient (Rahul) accesses Report.pdf');
  const rahulPrivateRes = await postRequest('/api/files/share-verify', {
    shareToken: '8f72d9e2',
    user: { email: 'rahul@blockshare.eth', name: 'Rahul Sharma' },
    callerAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  });
  console.log(`Status: ${rahulPrivateRes.statusCode}, allowed: ${rahulPrivateRes.data.allowed}`);
  if (rahulPrivateRes.statusCode === 200 && rahulPrivateRes.data.allowed === true) {
    console.log('✅ PASS: Authorized Recipient (Rahul) granted access in Private Mode!\n');
  } else {
    console.error('❌ FAIL: Rahul was not granted access in Private Mode', rahulPrivateRes);
    process.exit(1);
  }

  // Test 4: Owner toggles file to PUBLIC Mode (Owner Opt-In)
  console.log('Test 4: Owner toggles file to PUBLIC Mode (PUT /api/files/share-mode/:ipfsHash)');
  const togglePublicRes = await putRequest('/api/files/share-mode/8f72d9e2', {
    isPublic: true,
  });
  console.log(`Status: ${togglePublicRes.statusCode}, isPublic: ${togglePublicRes.data.isPublic}`);
  if (togglePublicRes.statusCode === 200 && togglePublicRes.data.isPublic === true) {
    console.log('✅ PASS: File successfully updated to Public mode on registry!\n');
  } else {
    console.error('❌ FAIL: Could not toggle to Public mode', togglePublicRes);
    process.exit(1);
  }

  // Test 5: In Public Mode, Stranger (Amit) with wallet & login MUST now be ALLOWED
  console.log('Test 5: Public Mode -> Stranger (Amit) accesses now-public Report.pdf');
  const amitPublicRes = await postRequest('/api/files/share-verify', {
    shareToken: '8f72d9e2',
    user: { email: 'amit@stranger.org', name: 'Amit Verma' },
    callerAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  });
  console.log(`Status: ${amitPublicRes.statusCode}, allowed: ${amitPublicRes.data.allowed}`);
  if (amitPublicRes.statusCode === 200 && amitPublicRes.data.allowed === true) {
    console.log('✅ PASS: Stranger (Amit) allowed access because Owner opted into Public Mode!\n');
  } else {
    console.error('❌ FAIL: Stranger was not allowed in Public Mode', amitPublicRes);
    process.exit(1);
  }

  // Test 6: Owner toggles file back to PRIVATE Mode (Reverting to strict Default)
  console.log('Test 6: Owner reverts file to PRIVATE Mode (Default)');
  const togglePrivateRes = await putRequest('/api/files/share-mode/8f72d9e2', {
    isPublic: false,
  });
  console.log(`Status: ${togglePrivateRes.statusCode}, isPublic: ${togglePrivateRes.data.isPublic}`);
  if (togglePrivateRes.statusCode === 200 && togglePrivateRes.data.isPublic === false) {
    console.log('✅ PASS: File successfully reverted to Private mode!\n');
  } else {
    console.error('❌ FAIL: Could not revert to Private mode', togglePrivateRes);
    process.exit(1);
  }

  // Test 7: Stranger (Amit) is once again BLOCKED at Stage 4
  console.log('Test 7: Re-verify Stranger (Amit) is BLOCKED again after reverting to Private Mode');
  const amitBlockedAgainRes = await postRequest('/api/files/share-verify', {
    shareToken: '8f72d9e2',
    user: { email: 'amit@stranger.org', name: 'Amit Verma' },
    callerAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  });
  console.log(`Status: ${amitBlockedAgainRes.statusCode}, allowed: ${amitBlockedAgainRes.data.allowed}, failedStage: ${amitBlockedAgainRes.data.failedStage}`);
  if (amitBlockedAgainRes.statusCode === 403 && amitBlockedAgainRes.data.allowed === false && String(amitBlockedAgainRes.data.failedStage).includes('Stage 4')) {
    console.log('✅ PASS: Zero-trust enforced: Stranger (Amit) blocked again!\n');
  } else {
    console.error('❌ FAIL: Stranger was not blocked after revert', amitBlockedAgainRes);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 ALL 7 PRIVATE & PUBLIC SHARING TEST CASES PASSED FLAWLESSLY!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
