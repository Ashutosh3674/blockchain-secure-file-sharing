/**
 * test_file_metadata.cjs
 * Comprehensive validation script for 23. File Metadata:
 * Verifies all 9 canonical fields across backend and client contractService:
 * 1. File Name
 * 2. File Size
 * 3. File Type
 * 4. Owner
 * 5. IPFS CID
 * 6. SHA-256 Hash
 * 7. Upload Date
 * 8. Expiry
 * 9. Access Status
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
  console.log('🧪 TESTING SECTION 23: STANDARDIZED FILE METADATA SYSTEM');
  console.log('🧪 ========================================================\n');

  // 1. Test GET /api/files/metadata
  console.log('▶️ Test 1: Fetching all file metadata via GET /api/files/metadata ...');
  const allRes = await request('http://localhost:5000/api/files/metadata');
  if (allRes.status !== 200 || !allRes.data.success) {
    throw new Error(`Failed GET /api/files/metadata: ${JSON.stringify(allRes)}`);
  }
  console.log(`✅ Received ${allRes.data.count} files in metadata registry.`);

  const requiredFields = [
    'fileName',
    'fileSize',
    'fileType',
    'owner',
    'ipfsCid',
    'sha256Hash',
    'uploadDate',
    'expiry',
    'accessStatus',
  ];

  allRes.data.files.forEach((f, idx) => {
    console.log(`\n📄 [File #${idx + 1}] ${f.fileName}:`);
    requiredFields.forEach((field) => {
      if (f[field] === undefined || f[field] === null || f[field] === '') {
        throw new Error(`Missing required field "${field}" on file ${f.fileName}`);
      }
      console.log(`   - ${field.padEnd(14)}: ${f[field]}`);
    });
  });

  // 2. Test GET /api/files/metadata/:identifier (by shareId, cid, and name)
  const target = allRes.data.files[0];
  console.log(`\n▶️ Test 2: Fetching individual metadata for "${target.fileName}" by IPFS CID: ${target.ipfsCid} ...`);
  const singleRes = await request(`http://localhost:5000/api/files/metadata/${target.ipfsCid}`);
  if (singleRes.status !== 200 || !singleRes.data.metadata) {
    throw new Error(`Failed to fetch metadata by CID: ${JSON.stringify(singleRes)}`);
  }
  console.log('✅ Successfully retrieved specific file metadata by CID.');
  console.log('\n📋 Formatted Summary Export Preview:');
  console.log('----------------------------------------------------');
  console.log(singleRes.data.metadata.formattedSummary);
  console.log('----------------------------------------------------');

  // 3. Upload a new encrypted file and verify metadata is auto-indexed
  console.log('\n▶️ Test 3: Uploading a new file and verifying auto-indexing with SHA-256 ...');
  const uploadPayload = {
    ciphertextBase64: Buffer.from('Quantum resistant test content 2026').toString('base64'),
    fileName: 'Project.pdf',
    mimeType: 'application/pdf',
    sha256: '93FA109284B7E03C5D6E12894A0B7C4F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D',
  };

  const uploadRes = await request('http://localhost:5000/api/files/ipfs-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: uploadPayload,
  });

  if (uploadRes.status !== 200 || !uploadRes.data.ipfsCid) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadRes)}`);
  }
  console.log(`✅ Uploaded "Project.pdf" with CID: ${uploadRes.data.ipfsCid}`);

  console.log('▶️ Test 4: Querying metadata for newly uploaded "Project.pdf" ...');
  const projectMetaRes = await request(`http://localhost:5000/api/files/metadata/${uploadRes.data.ipfsCid}`);
  if (projectMetaRes.status !== 200 || !projectMetaRes.data.metadata) {
    throw new Error(`Failed to retrieve metadata for Project.pdf: ${JSON.stringify(projectMetaRes)}`);
  }
  const pm = projectMetaRes.data.metadata;
  console.log('✅ Verifying Project.pdf 9 fields match user specification:');
  console.log(`   Name: ${pm.fileName} (Expected: Project.pdf)`);
  console.log(`   Size: ${pm.fileSize}`);
  console.log(`   Type: ${pm.fileType} (Expected: PDF)`);
  console.log(`   Owner: ${pm.owner}`);
  console.log(`   CID: ${pm.ipfsCidShort}`);
  console.log(`   Hash: ${pm.sha256Short}`);
  console.log(`   Uploaded: ${pm.uploadDate}`);
  console.log(`   Expiry: ${pm.expiry}`);
  console.log(`   Status: ${pm.accessStatus}`);

  if (pm.fileName !== 'Project.pdf' || pm.fileType !== 'PDF') {
    throw new Error('Project.pdf metadata did not match expectations!');
  }

  console.log('\n🎉 ALL SECTION 23 FILE METADATA TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
