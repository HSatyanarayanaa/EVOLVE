/* ═══════════════════════════════════════════════════
   Email + PDF Ticket Generator
   Sends emails via Gmail API (OAuth2) and generates PDF tickets
   ═══════════════════════════════════════════════════ */

const { google } = require('googleapis');
const PDFDocument = require('pdfkit');

/**
 * Get authenticated Gmail API client using OAuth2
 */
function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3001/oauth2callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Build a raw RFC 2822 email with HTML body and optional attachments
 */
function buildRawEmail({ from, to, bcc, subject, html, attachments }) {
  const boundary = '----=_NextPart_' + Date.now().toString(36);
  const toHeader = to ? `To: ${to}\r\n` : '';
  const bccHeader = bcc ? `Bcc: ${bcc}\r\n` : '';

  const headers = [
    `From: ${from}`,
    toHeader ? toHeader.trim() : null,
    bccHeader ? bccHeader.trim() : null,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ].filter(Boolean).join('\r\n');

  let raw = [
    headers,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64')
  ].join('\r\n');

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      raw += '\r\n' + [
        `--${boundary}`,
        `Content-Type: ${att.contentType}; name="${att.filename}"`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        att.content.toString('base64'),
      ].join('\r\n');
    }
  }

  raw += `\r\n--${boundary}--`;

  // URL-safe base64 encoding required by Gmail API
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a PDF ticket as a Buffer
 * @param {Object} data - Registration data
 * @returns {Promise<Buffer>}
 */
function generateTicketPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const W = 900, H = 320;
      const doc = new PDFDocument({
        size: [W, H],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Background ─────────────────────────────
      doc.rect(0, 0, 250, H).fill('#1a0e2e');
      doc.rect(250, 0, 480, H).fill('#d4b8f0');
      doc.rect(730, 0, 170, H).fill('#c9a8e8');

      // ── Perforated line (dashed) ─────────────
      doc.save();
      doc.strokeColor('#9b7ac0').lineWidth(1).dash(5, { space: 4 });
      doc.moveTo(730, 10).lineTo(730, H - 10).stroke();
      doc.restore();

      // ── Left Section — Event Branding ─────────
      doc.circle(125, 160, 100).fill('#2a1250');
      doc.circle(125, 160, 70).fill('#3d1a70');

      doc.fillColor('#a855f7')
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('EVOLVE', 30, 100, { width: 190, align: 'center' });

      doc.fillColor('#ec4899')
        .fontSize(10)
        .font('Helvetica')
        .text('1.0', 30, 135, { width: 190, align: 'center' });

      doc.fillColor('#9b7ac0')
        .fontSize(6)
        .font('Helvetica')
        .text('DEPARTMENT OF COMPUTER AND', 20, 240, { width: 210, align: 'center' })
        .text('COMMUNICATION ENGINEERING', 20, 249, { width: 210, align: 'center' });

      doc.fillColor('#c4a3e8')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text('PRESENTS', 20, 264, { width: 210, align: 'center' });

      // ── Center Section — Ticket Content ───────
      const cx = 270;

      doc.fillColor('#4a2875')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('EVOLVE — PARTICIPATION PASS', cx, 25, { width: 440, align: 'left' });

      doc.rect(cx, 42, 440, 2).fill('#6b3fa0');

      doc.fillColor('#2d1060')
        .fontSize(38)
        .font('Helvetica-Bold')
        .text('EVOLVE', cx, 52);

      doc.fillColor('#4a2875')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('BREAK. BUILD. BECOME.', cx, 95);

      // ── Team Name & Date Row ───────────────────
      const rowY = 150;

      doc.fillColor('#6b3fa0').fontSize(8).font('Helvetica-Bold')
        .text('TEAM NAME', cx, rowY - 2);
      doc.fillColor('#1a0e2e').fontSize(16).font('Helvetica-Bold')
        .text(data.teamName || 'TEAM NAME', cx, rowY + 10, { width: 260 });

      doc.fillColor('#6b3fa0').fontSize(8).font('Helvetica-Bold')
        .text('DATE', cx + 300, rowY - 2);
      doc.fillColor('#1a0e2e').fontSize(16).font('Helvetica-Bold')
        .text('06.04.2026', cx + 300, rowY + 10);

      // ── Venue & Time Row ───────────────────────
      const row2Y = 200;

      doc.rect(cx, row2Y - 10, 440, 1).fill('#9b7ac0');

      doc.fillColor('#1a0e2e').fontSize(10).font('Helvetica-Bold')
        .text('RAJALAKSHMI INSTITUTE OF TECHNOLOGY', cx, row2Y + 4);

      doc.fillColor('#6b3fa0').fontSize(12).font('Helvetica-Bold')
        .text('8:00AM', cx + 330, row2Y + 2);

      // ── Participants list ──────────────────────
      const pY = 235;
      doc.fillColor('#4a2875').fontSize(7).font('Helvetica-Bold')
        .text('PARTICIPANTS:', cx, pY);

      const names = (data.participants || []).map(p => p.name).filter(Boolean);
      doc.fillColor('#2d1060').fontSize(8).font('Helvetica')
        .text(names.join('  •  ') || 'N/A', cx, pY + 12, { width: 440 });

      doc.fillColor('#6b3fa0').fontSize(6).font('Helvetica')
        .text(`Transaction ID: ${data.transactionId || 'N/A'}`, cx, H - 25);

      // ── Right Stub ────────────────────────────
      const sx = 745;

      doc.circle(730, 0, 12).fill('#0f0f1e');
      doc.circle(730, H, 12).fill('#0f0f1e');

      doc.fillColor('#4a2875').fontSize(7).font('Helvetica')
        .text('TEAM ID', sx, 30, { width: 130, align: 'center' });
      doc.fillColor('#1a0e2e').fontSize(18).font('Helvetica-Bold')
        .text(`E-${String(data.rowIndex || '01').padStart(2, '0')}`, sx, 44, { width: 130, align: 'center' });

      doc.fillColor('#4a2875').fontSize(7).font('Helvetica')
        .text('TEAM SIZE', sx, 85, { width: 130, align: 'center' });
      doc.fillColor('#1a0e2e').fontSize(18).font('Helvetica-Bold')
        .text(`0${names.length || 0}`, sx, 99, { width: 130, align: 'center' });

      doc.fillColor('#4a2875').fontSize(7).font('Helvetica')
        .text('TRACK', sx, 140, { width: 130, align: 'center' });
      doc.fillColor('#1a0e2e').fontSize(18).font('Helvetica-Bold')
        .text(data.problemStatementId ? data.problemStatementId.split('-')[0] : '--', sx, 154, { width: 130, align: 'center' });

      const barcodeY = 200;
      const barcodeX = sx + 15;
      for (let i = 0; i < 40; i++) {
        const bw = Math.random() > 0.5 ? 2 : 1;
        doc.rect(barcodeX + i * 2.5, barcodeY, bw, 50).fill('#1a0e2e');
      }

      doc.save();
      doc.rotate(-90, { origin: [sx + 130, H / 2] });
      doc.fillColor('#4a2875').fontSize(6).font('Helvetica')
        .text('TICKET NUMBER:', sx + 100, H / 2 - 10);
      doc.restore();

      doc.fillColor('#4a2875').fontSize(6).font('Helvetica')
        .text(`TKT-${String(data.rowIndex || 1).padStart(4, '0')}`, sx, barcodeY + 55, { width: 130, align: 'center' });

      [{ x: 735, y: 35 }, { x: 735, y: 70 }, { x: 735, y: 120 }, { x: 735, y: 175 }].forEach(pos => {
        doc.circle(pos.x, pos.y, 4).fill('#d4b8f0');
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Send ticket email to all participants via Gmail API
 * @param {Object} data - Registration data with participants[]
 */
async function sendTicketEmails(data) {
  const gmail = getGmailClient();
  const pdfBuffer = await generateTicketPDF(data);

  const leaderEmail = data.participants && data.participants.length > 0 ? data.participants[0].email : null;
  const otherEmails = (data.participants || [])
    .slice(1)
    .map(p => p.email)
    .filter(email => email && email.includes('@'));

  if (!leaderEmail && otherEmails.length === 0) {
    throw new Error('No valid participant emails found');
  }

  const from = `"EVOLVE 1.0" <${process.env.SMTP_EMAIL}>`;
  const baseHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1e; padding: 40px 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a855f7; font-size: 28px; margin: 0;">EVOLVE 1.0</h1>
        <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0;">An inter-college hackathon for social impact & Innovation</p>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #22c55e; font-size: 20px; margin: 0 0 12px;">✅ Registration Confirmed!</h2>
        <p style="color: #d1d5db; font-size: 15px; margin: 0 0 8px;">
          Congratulations! Your team <strong style="color: #f0eef6;">"${data.teamName}"</strong> has been successfully registered for EVOLVE 1.0.
        </p>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
          College: ${data.college}<br>
          Transaction ID: <strong style="color: #a855f7;">${data.transactionId}</strong>
        </p>
      </div>
      <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #d1d5db; font-size: 14px; margin: 0 0 8px;">
          📎 Your event ticket is attached as a PDF.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Please bring this ticket (printed or digital) on the event day.
        </p>
      </div>
      <p style="color: #4b5563; font-size: 11px; text-align: center; margin-top: 24px;">
        © 2026 EVOLVE 1.0 | An inter-college hackathon for social impact & Innovation
      </p>
    </div>
  `;

  const leaderHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1e; padding: 40px 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a855f7; font-size: 28px; margin: 0;">EVOLVE 1.0</h1>
        <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0;">An inter-college hackathon for social impact & Innovation</p>
      </div>
      <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
        <h3 style="color: #22c55e; font-size: 18px; margin: 0 0 10px;">📱 Action Required: Join WhatsApp Group</h3>
        <p style="color: #d1d5db; font-size: 14px; margin: 0 0 16px;">
          As the Team Leader, please join our official WhatsApp group for important event announcements and problem statement releases.
        </p>
        <a href="https://chat.whatsapp.com/KcRGAeziKUYK71S7rYJ0sD" style="display: inline-block; padding: 12px 24px; background: #25D366; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
          Join WhatsApp Group
        </a>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #22c55e; font-size: 20px; margin: 0 0 12px;">✅ Registration Confirmed!</h2>
        <p style="color: #d1d5db; font-size: 15px; margin: 0 0 8px;">
          Congratulations! Your team <strong style="color: #f0eef6;">"${data.teamName}"</strong> has been successfully registered for EVOLVE 1.0.
        </p>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
          College: ${data.college}<br>
          Transaction ID: <strong style="color: #a855f7;">${data.transactionId}</strong>
        </p>
      </div>
      <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #d1d5db; font-size: 14px; margin: 0 0 8px;">
          📎 Your event ticket is attached as a PDF.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Please bring this ticket (printed or digital) on the event day.
        </p>
      </div>
      <p style="color: #4b5563; font-size: 11px; text-align: center; margin-top: 24px;">
        © 2026 EVOLVE 1.0 | An inter-college hackathon for social impact & Innovation
      </p>
    </div>
  `;

  // Provide common attachments variable
  const pdfAttachments = [
    {
      filename: `EVOLVE1.0_Ticket_${data.teamName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ];

  const subject = `EVOLVE 1.0 Event ticket for team "${data.teamName}"`;

  let resultLeader = null;
  // Send email to team leader alone with the whatsapp link
  if (leaderEmail && leaderEmail.includes('@')) {
    const rawMessageLeader = buildRawEmail({
      from,
      to: leaderEmail,
      subject,
      html: leaderHtml,
      attachments: pdfAttachments,
    });

    resultLeader = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessageLeader },
    });
    console.log(`✉️  Ticket email (with WA link) sent to leader: ${leaderEmail} (id: ${resultLeader.data.id})`);
  }

  let resultOthers = null;
  // Send standard email to all other participants
  if (otherEmails.length > 0) {
    const rawMessageOthers = buildRawEmail({
      from,
      bcc: otherEmails.join(', '),
      subject,
      html: baseHtml,
      attachments: pdfAttachments,
    });

    resultOthers = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessageOthers },
    });
    console.log(`✉️  Ticket email sent to others: ${otherEmails.join(', ')} (id: ${resultOthers.data.id})`);
  }

  return resultLeader || resultOthers;
}

/**
 * Send problem statements release notification to all confirmed participants
 * @param {string[]} emails - Array of participant email addresses
 */
async function sendProblemReleaseEmails(emails) {
  const gmail = getGmailClient();

  if (emails.length === 0) {
    throw new Error('No emails to send to');
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const from = `"EVOLVE 1.0" <${process.env.SMTP_EMAIL}>`;
  const subject = '🚀 EVOLVE 1.0 — Problem Statements are LIVE!';
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1e; padding: 40px 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a855f7; font-size: 28px; margin: 0;">EVOLVE 1.0</h1>
        <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0;">An inter-college hackathon for social impact & Innovation</p>
      </div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #ec4899; font-size: 22px; margin: 0 0 12px; text-align: center;">🚀 Problem Statements Released!</h2>
        <p style="color: #d1d5db; font-size: 15px; margin: 0 0 16px; text-align: center;">
          The problem statements for EVOLVE 1.0 are now live! Your team leader can now select a problem statement.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${siteUrl}/#/select-problem" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
            View & Select Problem Statement →
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; margin: 0; text-align: center;">
          ⚠️ Only the team leader can select a problem statement. Once selected, it cannot be changed.
        </p>
      </div>
      <p style="color: #4b5563; font-size: 11px; text-align: center; margin-top: 24px;">
        © 2026 EVOLVE 1.0 | Rajalakshmi Institute of Technology
      </p>
    </div>
  `;

  const rawMessage = buildRawEmail({
    from,
    bcc: emails.join(', '),
    subject,
    html,
  });

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: rawMessage },
  });

  console.log(`📧 Problem release emails sent to ${emails.length} participants (id: ${result.data.id})`);
  return result;
}

module.exports = { sendTicketEmails, generateTicketPDF, sendProblemReleaseEmails };
