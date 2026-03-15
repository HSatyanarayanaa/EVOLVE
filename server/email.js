/* ═══════════════════════════════════════════════════
   Email + PDF Ticket Generator
   Sends emails via Gmail API (OAuth2) and generates PDF tickets
   ═══════════════════════════════════════════════════ */

const { google } = require('googleapis');
const PDFDocument = require('pdfkit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

const fs = require('fs');
const SVGtoPDF = require('svg-to-pdfkit');

/**
 * Generate a PDF ticket as a Buffer using SVG template
 * @param {Object} data - Registration data
 * @returns {Promise<Buffer>}
 */
function generateTicketPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      // Read SVG template from root
      const svgPath = path.join(__dirname, '..', 'Frame 2.svg');
      let svgContent = fs.readFileSync(svgPath, 'utf8');

      // 1. Remove Placeholders from SVG content using broader RegEx for complex vectorized paths
      // Team Name placeholder (at x~834 and others)
      svgContent = svgContent.replace(/<path[^>]*d="M834\.436 268\.104[\s\S]*?\/>/g, ''); // Stub placeholder
      svgContent = svgContent.replace(/<path[^>]*d="M611\.845 207\.709[\s\S]*?\/>/g, ''); // Main pass placeholder
      
      // Team ID and Size placeholders
      svgContent = svgContent.replace(/<path[^>]*d="M827\.709 96\.1553[\s\S]*?\/>/g, '');
      svgContent = svgContent.replace(/<path[^>]*d="M822\.709 186\.155[\s\S]*?\/>/g, '');

      // Additional safety for any other black paths in the stub area
      svgContent = svgContent.replace(/<path[^>]*d="M913[\s\S]*?\/>/g, '');

      // The SVG width/height are 1001x318
      const W = 1001, H = 318;
      const doc = new PDFDocument({
        size: [W, H],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 2. Render THE MODIFIED SVG background
      SVGtoPDF(doc, svgContent, 0, 0);

      // 3. Overlay Dynamic Text
      // Dynamic Values
      const teamName = data.teamName || 'TEAM NAME';
      const teamId = `E-${String(data.rowIndex || '01').padStart(2, '0')}`;
      const teamSize = `0${(data.participants || []).length || 0}`;
      const ticketNum = data.ticketId || `TKT-${String(data.rowIndex || '0042').padStart(4, '0')}`;
      
      // 1. Team Name (Horizontal in the Participation Pass slot)
      const teamNameStr = teamName.toUpperCase();
      
      // Legacy alignment: x=265, width=270
      let fontSize = 16;
      if (teamNameStr.length > 25) fontSize = 14; 
      if (teamNameStr.length > 40) fontSize = 11;

      doc.fillColor('black');
      doc.font('Helvetica-Bold').fontSize(fontSize);
      doc.text(teamNameStr, 265, 145, { 
          width: 270,
          align: 'center',
          lineGap: -2
      });

      // 2. Team ID (Vertical in the Pink Section slot)
      doc.save();
      // Legacy position: x=645, y=110
      doc.translate(645, 110); 
      doc.rotate(270);
      doc.fillColor('black').font('Helvetica-Bold').fontSize(14)
         .text(teamId, 0, 0);
      doc.restore();

      // 3. Team Size (Vertical in the Pink Section slot)
      doc.save();
      // Legacy position: x=645, y=160
      doc.translate(645, 160); 
      doc.rotate(270);
      doc.fillColor('black').font('Helvetica-Bold').fontSize(14)
         .text(teamSize, 0, 0);
      doc.restore();

      // 4. Ticket Number (Vertical in the White Stub slot)
      doc.save();
      doc.translate(910, 240); 
      doc.rotate(270);
      doc.fillColor('black').font('Helvetica-Bold').fontSize(12)
          .text(ticketNum, 0, 0);
      doc.restore();

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
