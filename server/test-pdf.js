const fs = require('fs');
const PDFDocument = require('pdfkit');

const data = {
    teamName: 'Code Crusaders',
    rowIndex: 2,
    participants: [
        { name: 'Satya Hari' },
        { name: 'Priya Kumar' },
        { name: 'Ananya Singh' }
    ],
    transactionId: 'TXN987654321',
    problemStatementId: ''
};

function generateTicketPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const W = 900, H = 320;
            const doc = new PDFDocument({
                size: [W, H],
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
            });

            const stream = fs.createWriteStream('/Users/satya/Desktop/code-a-thon/server/test-ticket.pdf');
            doc.pipe(stream);

            doc.on('end', () => resolve());
            doc.on('error', reject);

            doc.rect(0, 0, 250, H).fill('#1a0e2e');
            doc.rect(250, 0, 480, H).fill('#d4b8f0');
            doc.rect(730, 0, 170, H).fill('#c9a8e8');

            doc.save();
            doc.strokeColor('#9b7ac0').lineWidth(1).dash(5, { space: 4 });
            doc.moveTo(730, 10).lineTo(730, H - 10).stroke();
            doc.restore();

            doc.circle(125, 160, 100).fill('#2a1250');
            doc.circle(125, 160, 70).fill('#3d1a70');

            doc.fillColor('#a855f7')
                .fontSize(32)
                .font('Helvetica-Bold')
                .text('EVOLVE', 30, 100, { width: 190, align: 'center' });

            doc.fillColor('#ec4899')
                .fontSize(10)
                .font('Helvetica')
                .text('2K26', 30, 135, { width: 190, align: 'center' });

            doc.fillColor('#9b7ac0')
                .fontSize(6)
                .font('Helvetica')
                .text('DEPARTMENT OF COMPUTER AND', 20, 240, { width: 210, align: 'center' })
                .text('COMMUNICATION ENGINEERING', 20, 249, { width: 210, align: 'center' });

            doc.fillColor('#c4a3e8')
                .fontSize(7)
                .font('Helvetica-Bold')
                .text('PRESENTS', 20, 264, { width: 210, align: 'center' });

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

            const rowY = 150;

            doc.fillColor('#6b3fa0').fontSize(8).font('Helvetica-Bold')
                .text('TEAM NAME', cx, rowY - 2);
            doc.fillColor('#1a0e2e').fontSize(16).font('Helvetica-Bold')
                .text(data.teamName || 'TEAM NAME', cx, rowY + 10, { width: 260 });

            doc.fillColor('#6b3fa0').fontSize(8).font('Helvetica-Bold')
                .text('DATE', cx + 300, rowY - 2);
            doc.fillColor('#1a0e2e').fontSize(16).font('Helvetica-Bold')
                .text('06.04.2026', cx + 300, rowY + 10);

            const row2Y = 200;

            doc.rect(cx, row2Y - 10, 440, 1).fill('#9b7ac0');

            doc.fillColor('#1a0e2e').fontSize(10).font('Helvetica-Bold')
                .text('RAJALAKSHMI INSTITUTE OF TECHNOLOGY', cx, row2Y + 4);

            doc.fillColor('#6b3fa0').fontSize(12).font('Helvetica-Bold')
                .text('8:00AM', cx + 330, row2Y + 2);

            const pY = 235;
            doc.fillColor('#4a2875').fontSize(7).font('Helvetica-Bold')
                .text('PARTICIPANTS:', cx, pY);

            const names = (data.participants || []).map(p => p.name).filter(Boolean);
            doc.fillColor('#2d1060').fontSize(8).font('Helvetica')
                .text(names.join('  •  ') || 'N/A', cx, pY + 12, { width: 440 });

            doc.fillColor('#6b3fa0').fontSize(6).font('Helvetica')
                .text(`Transaction ID: ${data.transactionId || 'N/A'}`, cx, H - 25);

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

generateTicketPDF(data)
    .then(() => console.log("PDF generated at test-ticket.pdf"))
    .catch(console.error);
