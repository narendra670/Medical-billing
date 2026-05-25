const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const Invoice = require('../models/Invoice');

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const FONT_SIZE = 12;
const SMALL_FONT_SIZE = 10;
const TABLE_HEADER_HEIGHT = 30;
const ROW_HEIGHT = 25;

const drawText = (page, text, x, y, size = FONT_SIZE, font, color = rgb(0, 0, 0), options = {}) => {
    const textWidth = font.widthOfTextAtSize(String(text), size);
    const align = options.align || 'left';
    const finalX = align === 'right' ? x - textWidth : x;
    page.drawText(String(text), { x: finalX, y, size, font, color });
};

const drawHeader = (page, font, boldFont, width, margin, invoice) => {
    let yPos = PAGE_HEIGHT - margin;
    drawText(page, 'SHREE GANESH MEDICAL STORE', margin, yPos, 20, boldFont, rgb(0.1, 0.3, 0.7));
    yPos -= 20;
    drawText(page, 'Lucknow, Uttar Pradesh', margin, yPos, SMALL_FONT_SIZE, font, rgb(0.3, 0.3, 0.3));
    drawText(page, 'GSTIN: 09ABCDE1234F1Z5 • Phone: +91 98765 43210', margin, yPos - 15, SMALL_FONT_SIZE, font, rgb(0.3, 0.3, 0.3));

    drawText(page, 'INVOICE', width - margin - 120, yPos + 20, 28, boldFont, rgb(0.1, 0.3, 0.7));
    drawText(page, `#${invoice.invoiceNumber}`, width - margin - 120, yPos, SMALL_FONT_SIZE, font, rgb(0.3, 0.3, 0.3));

    const invoiceDate = invoice.date ? new Date(invoice.date) : new Date();
    const dateStr = invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    drawText(page, `Date: ${dateStr}`, width - margin - 120, yPos - 15, SMALL_FONT_SIZE, font, rgb(0.3, 0.3, 0.3));

    return yPos - 50;
};

const drawSeparator = (page, width, margin, yPos, thickness = 2, color = rgb(0.2, 0.2, 0.2)) => {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness, color });
};

const drawCustomerInfo = (page, font, boldFont, width, margin, invoice, startY) => {
    let yPos = startY - 30;

    drawText(page, 'Bill To', margin, yPos, SMALL_FONT_SIZE, boldFont, rgb(0.4, 0.4, 0.4));
    drawText(page, 'From', width - margin - 200, yPos, SMALL_FONT_SIZE, boldFont, rgb(0.4, 0.4, 0.4));
    yPos -= 20;

    drawText(page, invoice.customer.name, margin, yPos, FONT_SIZE, boldFont);
    yPos -= 18;
    drawText(page, invoice.customer.mobile, margin, yPos, SMALL_FONT_SIZE, font);
    yPos -= 18;
    if (invoice.customer.address) {
        drawText(page, invoice.customer.address, margin, yPos, SMALL_FONT_SIZE, font);
    }

    let fromY = startY - 30 + 38;
    drawText(page, 'Shree Ganesh Medical Store', width - margin - 200, fromY, FONT_SIZE, boldFont);
    fromY -= 18;
    drawText(page, 'Near Charbagh Railway Station, Lucknow', width - margin - 200, fromY, SMALL_FONT_SIZE, font);
    fromY -= 18;
    drawText(page, 'Uttar Pradesh - 226001', width - margin - 200, fromY, SMALL_FONT_SIZE, font);

    return startY - 90;
};

const drawTableHeader = (page, font, boldFont, width, margin, yPos) => {
    const headers = ['Medicine', 'Batch', 'Expiry', 'Qty', 'Price', 'GST%', 'Amount'];
    const colWidths = [150, 60, 70, 40, 60, 50, 75];

    page.drawRectangle({
        x: margin, y: yPos - 5, width: width - 2 * margin, height: TABLE_HEADER_HEIGHT,
        color: rgb(0.95, 0.95, 0.95),
    });

    drawSeparator(page, width, margin, yPos - 5, 2);

    let xPos = margin;
    headers.forEach((header, i) => {
        const align = (i >= 3) ? { x: xPos + colWidths[i] - 5, align: 'right' } : { x: xPos + 5 };
        drawText(page, header, align.x, yPos + 5, SMALL_FONT_SIZE, boldFont, rgb(0, 0, 0), align);
        xPos += colWidths[i];
    });

    return { y: yPos - 30, colWidths };
};

const drawTotals = (page, font, boldFont, width, margin, invoice, yPos) => {
    const totalsWidth = 220;
    const totalsX = width - margin - totalsWidth;
    const valueX = width - margin - 10;

    drawText(page, 'Subtotal', totalsX, yPos, SMALL_FONT_SIZE, font);
    drawText(page, `Rs.${(Number(invoice.subtotal) || 0).toFixed(2)}`, valueX, yPos, SMALL_FONT_SIZE, font, rgb(0, 0, 0), { align: 'right' });
    yPos -= 25;

    drawSeparator(page, width, totalsX, yPos + 15, 1, rgb(0.7, 0.7, 0.7));

    drawText(page, 'Total GST', totalsX, yPos, SMALL_FONT_SIZE, font);
    drawText(page, `Rs.${(Number(invoice.totalGst) || 0).toFixed(2)}`, valueX, yPos, SMALL_FONT_SIZE, font, rgb(0, 0, 0), { align: 'right' });
    yPos -= 30;

    drawSeparator(page, width, totalsX, yPos + 15, 2);

    drawText(page, 'Grand Total', totalsX, yPos, 14, boldFont, rgb(0.1, 0.3, 0.7));
    drawText(page, `Rs.${(Number(invoice.grandTotal) || 0).toFixed(2)}`, valueX, yPos, 14, boldFont, rgb(0.1, 0.3, 0.7), { align: 'right' });

    return yPos - 60;
};

const drawFooter = (page, font, width, margin, yPos) => {
    drawText(page, 'Thank you for your purchase! • Medicines are non-returnable after sale.', margin, yPos, SMALL_FONT_SIZE, font, rgb(0.5, 0.5, 0.5));
    yPos -= 15;
    drawText(page, 'This is a computer-generated invoice. No signature required.', margin, yPos, SMALL_FONT_SIZE, font, rgb(0.5, 0.5, 0.5));
};

exports.generateInvoicePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const width = PAGE_WIDTH;

        const addNewPage = (pdfDoc) => {
            const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            return page;
        };

        let page = addNewPage(pdfDoc);
        let yPos = drawHeader(page, font, boldFont, width, MARGIN, invoice);
        drawSeparator(page, width, MARGIN, yPos);
        yPos = drawCustomerInfo(page, font, boldFont, width, MARGIN, invoice, yPos);

        yPos -= 15;
        const tableInfo = drawTableHeader(page, font, boldFont, width, MARGIN, yPos);
        const colWidths = tableInfo.colWidths;
        yPos = tableInfo.y;

        for (let idx = 0; idx < invoice.items.length; idx++) {
            const item = invoice.items[idx];

            // Check if we need a new page (need at least 100px for footer)
            if (yPos < 120) {
                drawFooter(page, font, width, MARGIN, yPos);
                page = addNewPage(pdfDoc);
                yPos = PAGE_HEIGHT - MARGIN;

                // Repeat header on new page
                yPos = drawHeader(page, font, boldFont, width, MARGIN, invoice);
                drawSeparator(page, width, MARGIN, yPos);
                drawText(page, `${invoice.customer.name} (continued...)`, MARGIN, yPos - 18, SMALL_FONT_SIZE, font, rgb(0.3, 0.3, 0.3));
                yPos -= 40;

                const contTable = drawTableHeader(page, font, boldFont, width, MARGIN, yPos);
                yPos = contTable.y;
            }

            const amount = item.total
                ? Number(item.total).toFixed(2)
                : ((Number(item.price) || 0) * (Number(item.quantity) || 0) * (1 + (Number(item.gstPercent) || 0) / 100)).toFixed(2);

            const expiryStr = item.expiryDate
                ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
                : '-';

            const values = [
                item.medicineName,
                item.batchNumber || '-',
                expiryStr,
                String(item.quantity),
                `Rs.${(Number(item.price) || 0).toFixed(2)}`,
                `${Number(item.gstPercent) || 0}%`,
                `Rs.${amount}`
            ];

            let xPos = MARGIN;
            values.forEach((value, i) => {
                const isRight = (i >= 3);
                const x = isRight ? xPos + colWidths[i] - 5 : xPos + 5;
                drawText(page, value, x, yPos + 5, SMALL_FONT_SIZE, font, rgb(0, 0, 0), isRight ? { align: 'right' } : {});
                xPos += colWidths[i];
            });

            yPos -= ROW_HEIGHT;

            page.drawLine({
                start: { x: MARGIN, y: yPos + 10 }, end: { x: width - MARGIN, y: yPos + 10 },
                thickness: 0.5, color: rgb(0.85, 0.85, 0.85),
            });
        }

        yPos -= 20;
        yPos = drawTotals(page, font, boldFont, width, MARGIN, invoice, yPos);
        drawFooter(page, font, width, MARGIN, yPos);

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
};
