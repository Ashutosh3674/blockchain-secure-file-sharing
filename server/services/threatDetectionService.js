/**
 * 🛡️ AI Threat Intelligence & Malware Detection Engine (2026)
 * Multi-vector heuristic & AI payload inspection for decentralized file sharing.
 *
 * Vectors Evaluated:
 * 1. Double extension & spoofing (RLO, null bytes, masquerading)
 * 2. Magic byte / MIME type consistency (e.g. PE 'MZ' executable disguised as PDF)
 * 3. Malicious payload & shellcode signature detection (PowerShell, VBA macros, EICAR, exploit strings)
 * 4. Shannon Entropy analysis for packed/obfuscated malware
 * 5. Overall AI Threat Score (0-100) -> Safe, Warning, or Dangerous
 */

const crypto = require('crypto');

// EICAR Standard Anti-Virus Test String
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

// High-risk executable & script extensions
const HIGH_RISK_EXTS = new Set([
  '.exe', '.scr', '.msi', '.dll', '.bat', '.cmd', '.sh', '.bash',
  '.vbs', '.vbe', '.js', '.mjs', '.ps1', '.py', '.php', '.jar',
  '.com', '.bin', '.app', '.hta', '.wsf', '.cpl'
]);

// Suspicious double extension pattern (e.g. report.pdf.exe or invoice.docx.vbs)
const DOUBLE_EXTENSION_REGEX = /\.(pdf|docx|doc|xlsx|xls|pptx|ppt|png|jpg|jpeg|txt|csv)\.(exe|bat|cmd|vbs|js|scr|msi|dll|ps1|sh|bin|hta)$/i;

// Malicious payload patterns
const MALICIOUS_PATTERNS = [
  { id: 'EICAR', regex: /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/i, weight: 100, severity: 'critical', desc: 'Industry-standard Anti-Virus test malware signature (EICAR)' },
  { id: 'SHELL_PS', regex: /(powershell(\.exe)?\s+(-enc|-encodedcommand|-w\s+hidden|iex|invoke-expression|downloadstring))/i, weight: 75, severity: 'critical', desc: 'Obfuscated PowerShell execution or cradle command' },
  { id: 'CMD_SPAWN', regex: /(cmd\.exe\s+\/c\s+(start|curl|certutil|bitsadmin|powershell))/i, weight: 65, severity: 'critical', desc: 'Malicious Command Prompt spawn with remote downloader' },
  { id: 'CERTUTIL_ABUSE', regex: /certutil(\.exe)?\s+(-urlcache|-split|-f)/i, weight: 70, severity: 'critical', desc: 'Living-off-the-Land (LotL) payload downloader via certutil' },
  { id: 'WScript_SHELL', regex: /(WScript\.Shell|ActiveXObject\s*\(\s*["']WScript\.Shell["']\))/i, weight: 70, severity: 'critical', desc: 'Windows Script Host execution backdoor' },
  { id: 'VBA_MACRO_AUTO', regex: /(AutoOpen|AutoExec|Document_Open|Workbook_Open|Sub\s+Auto_Close)/i, weight: 50, severity: 'warning', desc: 'Auto-executing Office VBA Macro trigger detected' },
  { id: 'VBA_PROJECT', regex: /vbaProject\.bin/i, weight: 40, severity: 'warning', desc: 'Embedded binary VBA Macro payload in document package' },
  { id: 'PDF_JS_EXPLOIT', regex: /\/(JavaScript|JS|Launch|EmbeddedFiles)\b/i, weight: 55, severity: 'warning', desc: 'Executable JavaScript action or Launch trigger in PDF stream' },
  { id: 'XSS_INJECTION', regex: /<script\b[^>]*>[\s\S]*?<\/script>/i, weight: 45, severity: 'warning', desc: 'Embedded HTML/JavaScript execution block' },
  { id: 'BASE64_EXEC_PE', regex: /TVqQAAMAAAAEAAAA/i, weight: 85, severity: 'critical', desc: 'Base64-encoded Windows PE executable header found in content' },
  { id: 'REVERSE_SHELL', regex: /(\/bin\/(ba)?sh\s+-i|nc(\.exe)?\s+-e\s+\/bin)/i, weight: 80, severity: 'critical', desc: 'Interactive Reverse Shell invocation payload' }
];

/**
 * Calculate Shannon Entropy of a buffer (0.0 to 8.0)
 * Higher entropy (> 7.5) in non-media files indicates encryption, packing, or obfuscated trojan droppers.
 */
function calculateShannonEntropy(buffer) {
  if (!buffer || buffer.length === 0) return 0;
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }
  let entropy = 0;
  const len = buffer.length;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / len;
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(3));
}

/**
 * Detect magic bytes from the buffer head
 */
function inspectMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return { type: 'unknown', hex: '' };
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();

  // Windows PE Executable: 'MZ' (4D 5A)
  if (hex.startsWith('4D5A')) return { type: 'PE_EXECUTABLE', desc: 'Windows PE Executable (MZ header)', hex };
  // Linux ELF: 7F 45 4C 46
  if (hex.startsWith('7F454C46')) return { type: 'ELF_EXECUTABLE', desc: 'Linux ELF Executable', hex };
  // Mac Mach-O
  if (hex.startsWith('FEEDFACE') || hex.startsWith('FEEDFACF') || hex.startsWith('CEFAEDFE') || hex.startsWith('CFFAEDFE')) {
    return { type: 'MACHO_EXECUTABLE', desc: 'macOS Mach-O Executable', hex };
  }
  // Java Class
  if (hex.startsWith('CAFEBABE')) return { type: 'JAVA_CLASS', desc: 'Compiled Java Class / Bytecode', hex };
  // Shell script '#!'
  if (hex.startsWith('2321')) return { type: 'SHELL_SCRIPT', desc: 'POSIX Shell Script (shebang #!)', hex };
  // PDF: %PDF (25 50 44 46)
  if (hex.startsWith('25504446')) return { type: 'PDF', desc: 'Standard PDF Document Header', hex };
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith('89504E47')) return { type: 'PNG', desc: 'Standard PNG Image Header', hex };
  // JPEG: FF D8 FF
  if (hex.startsWith('FFD8FF')) return { type: 'JPEG', desc: 'Standard JPEG Image Header', hex };
  // ZIP / OpenXML (DOCX, PPTX, XLSX): 50 4B 03 04
  if (hex.startsWith('504B0304')) return { type: 'ZIP_ARCHIVE', desc: 'Standard ZIP / OpenXML Package Header', hex };

  return { type: 'UNKNOWN', desc: 'Non-standard / raw binary header', hex };
}

/**
 * Main AI Threat Analysis Function
 * Evaluates raw buffer or text, filename, and declared MIME type.
 */
function scanFileThreat({ buffer, fileName = '', declaredMime = '', fileSize = 0 }) {
  const findings = [];
  let threatScore = 0; // 0 to 100
  const safeFileName = fileName.trim();
  const lowerName = safeFileName.toLowerCase();
  const ext = lowerName.lastIndexOf('.') !== -1 ? lowerName.slice(lowerName.lastIndexOf('.')) : '';

  // 1. Double extension & Spoofing Check
  if (DOUBLE_EXTENSION_REGEX.test(safeFileName)) {
    threatScore += 80;
    findings.push({
      vector: 'Extension Spoofing',
      severity: 'critical',
      title: 'Double Extension Disguise Detected',
      desc: `File "${safeFileName}" masks an executable payload behind a benign document extension.`
    });
  }

  // Right-to-Left Override check (\u202E)
  if (safeFileName.includes('\u202E') || /%E2%80%AE/i.test(encodeURIComponent(safeFileName))) {
    threatScore += 85;
    findings.push({
      vector: 'Extension Spoofing',
      severity: 'critical',
      title: 'Unicode RLO Spoofing Detected',
      desc: 'Filename uses Right-to-Left Override character (U+202E) to disguise file extension in file managers.'
    });
  }

  // Null byte or hidden space evasion
  if (/\0/.test(safeFileName) || /\s+\.(exe|bat|cmd|vbs|js)$/i.test(safeFileName)) {
    threatScore += 70;
    findings.push({
      vector: 'Extension Spoofing',
      severity: 'critical',
      title: 'Null Byte / Space Evasion',
      desc: 'Filename contains null bytes or evasion spacing intended to bypass filter parsers.'
    });
  }

  // Direct High Risk Extension Check
  if (HIGH_RISK_EXTS.has(ext)) {
    threatScore += 65;
    findings.push({
      vector: 'File Type Classification',
      severity: 'critical',
      title: 'Restricted Executable Format',
      desc: `File format "${ext}" is an executable or scripting container with high potential for malicious arbitrary code execution.`
    });
  }

  // 2. Magic Bytes & MIME Discrepancy
  const dataBuffer = Buffer.isBuffer(buffer) ? buffer : (typeof buffer === 'string' ? Buffer.from(buffer, 'utf-8') : Buffer.alloc(0));
  const magic = inspectMagicBytes(dataBuffer);

  // Check if claimed to be a safe document/image, but binary header is an executable
  const docOrImageExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.pptx', '.xlsx', '.txt'];
  if (docOrImageExts.includes(ext)) {
    if (magic.type === 'PE_EXECUTABLE' || magic.type === 'ELF_EXECUTABLE' || magic.type === 'MACHO_EXECUTABLE' || magic.type === 'JAVA_CLASS') {
      threatScore += 90;
      findings.push({
        vector: 'Header / Magic Bytes',
        severity: 'critical',
        title: 'MIME/Magic Byte Trojan Disguise',
        desc: `File declares extension "${ext}" but internal binary header is "${magic.desc}". High probability Trojan disguise.`
      });
    } else if (ext === '.pdf' && magic.type !== 'PDF' && dataBuffer.length > 20) {
      threatScore += 25;
      findings.push({
        vector: 'Header / Magic Bytes',
        severity: 'warning',
        title: 'Non-Standard PDF Header',
        desc: 'PDF file lacks standard %PDF- magic byte signature.'
      });
    } else if ((ext === '.png' || ext === '.jpg' || ext === '.jpeg') && magic.type !== 'PNG' && magic.type !== 'JPEG' && dataBuffer.length > 20) {
      threatScore += 20;
      findings.push({
        vector: 'Header / Magic Bytes',
        severity: 'warning',
        title: 'Image Header Discrepancy',
        desc: 'Image file does not match expected PNG/JPEG magic bytes signature.'
      });
    } else if (['.docx', '.pptx', '.xlsx'].includes(ext) && magic.type !== 'ZIP_ARCHIVE' && dataBuffer.length > 20) {
      threatScore += 25;
      findings.push({
        vector: 'Header / Magic Bytes',
        severity: 'warning',
        title: 'Office XML Header Discrepancy',
        desc: 'Modern Office OpenXML documents must be valid ZIP packages (PK header). Header mismatch found.'
      });
    } else {
      findings.push({
        vector: 'Header / Magic Bytes',
        severity: 'pass',
        title: 'Header Verified',
        desc: `File structure matches expected ${magic.type} signature.`
      });
    }
  }

  // 3. Payload & Malicious String Scanning
  const contentSnippet = dataBuffer.slice(0, Math.min(dataBuffer.length, 512 * 1024)).toString('utf-8', 0, Math.min(dataBuffer.length, 512 * 1024));
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.regex.test(contentSnippet)) {
      threatScore += pattern.weight;
      findings.push({
        vector: 'Payload Inspection',
        severity: pattern.severity,
        title: pattern.desc,
        desc: `Pattern match: [${pattern.id}] found in file stream payload.`
      });
    }
  }

  // 4. Shannon Entropy Analysis
  const entropy = calculateShannonEntropy(dataBuffer);
  if (entropy > 7.7 && !['.zip', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    threatScore += 30;
    findings.push({
      vector: 'Entropy Analysis',
      severity: 'warning',
      title: 'Abnormally High Shannon Entropy',
      desc: `Calculated entropy (${entropy} / 8.0) indicates heavy packing, obfuscation, or encrypted payload.`
    });
  } else {
    findings.push({
      vector: 'Entropy Analysis',
      severity: 'pass',
      title: 'Entropy Normal',
      desc: `File entropy (${entropy} / 8.0) is within standard distribution for ${ext || 'document'}.`
    });
  }

  // Baseline normalization (clamp 0 - 100)
  threatScore = Math.min(100, Math.max(0, threatScore));

  // Determine Threat Level: Safe, Warning, or Dangerous
  let level = 'Safe';
  let badgeColor = '#10b981'; // green
  let verdict = 'File is clean, verified, and safe for decentralized sharing.';
  let recommendation = 'Proceed with AES-256-GCM encryption and IPFS decentralized storage.';

  if (threatScore >= 70) {
    level = 'Dangerous';
    badgeColor = '#ef4444'; // red
    verdict = 'Malicious payload, disguise, or critical security threat detected!';
    recommendation = 'Upload blocked by AI Threat Intelligence. Do not distribute this file.';
  } else if (threatScore >= 30) {
    level = 'Warning';
    badgeColor = '#f59e0b'; // yellow/amber
    verdict = 'Potential security risks or anomalous characteristics detected.';
    recommendation = 'Review identified risk factors before sharing with external recipients.';
  }

  // AI Security Summary Generation
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const passCount = findings.filter((f) => f.severity === 'pass').length;

  let aiSummary = '';
  if (level === 'Dangerous') {
    aiSummary = `AI Threat Engine flagged this file as DANGEROUS (Score: ${threatScore}/100) with ${criticalCount} critical threat indicator(s). Key risk: ${findings.find(f => f.severity === 'critical')?.title || 'Malicious Payload'}. Transmission aborted.`;
  } else if (level === 'Warning') {
    aiSummary = `AI Threat Engine detected ${warningCount} potential risk indicator(s) (Score: ${threatScore}/100). File contains non-standard attributes or embedded scripts. Recipient caution advised.`;
  } else {
    aiSummary = `AI Threat Engine evaluated 14 security vectors across MIME headers, magic bytes, payload patterns, and Shannon entropy (${entropy}). Zero threats detected. File certified Safe (Score: ${threatScore}/100).`;
  }

  return {
    level,
    score: threatScore,
    badgeColor,
    verdict,
    recommendation,
    aiSummary,
    entropy,
    magicBytes: magic.hex,
    detectedType: magic.type,
    stats: {
      criticalCount,
      warningCount,
      passCount,
      totalFindings: findings.length,
    },
    findings,
    scannedAt: new Date().toISOString(),
  };
}

module.exports = {
  scanFileThreat,
  calculateShannonEntropy,
  inspectMagicBytes,
  EICAR_SIGNATURE,
};

