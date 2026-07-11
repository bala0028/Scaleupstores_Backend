// pdfkit is CommonJS — require() is the only reliable way under bun/tsx
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

// ─── helpers ────────────────────────────────────────────────────────────────

function toWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + toWords(-n);

  function convert(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + convert(num % 10);
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + convert(num % 100);
    if (num < 100000) return convert(Math.floor(num / 1000)) + 'Thousand ' + convert(num % 1000);
    if (num < 10000000) return convert(Math.floor(num / 100000)) + 'Lakh ' + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + 'Crore ' + convert(num % 10000000);
  }

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = convert(intPart).trim() + ' Rupees';
  if (decPart > 0) result += ' and ' + convert(decPart).trim() + ' Paise';
  return result + ' Only';
}

function bufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ─── Invoice PDF ─────────────────────────────────────────────────────────────

export async function generateInvoicePdf(order: any): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const promise = bufferFromDoc(doc);

  const W = 515; // usable width
  const COL = { name: 40, qty: 320, price: 380, total: 450 };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').text('SCALEUPSTORES', 40, 40);
  doc.fontSize(9).font('Helvetica').fillColor('#555')
    .text('No.12, Main Street, Chennai - 600001', 40, 65)
    .text('Phone: +91 98765 43210  |  Email: support@scaleupstores.com', 40, 78)
    .text('GSTIN: 33XXXXXXXXX1ZX', 40, 91);

  // Invoice block (right aligned)
  doc.fillColor('#000').fontSize(14).font('Helvetica-Bold')
    .text('INVOICE', 400, 40, { width: 155, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Invoice No: ${order.invoice?.invoiceNumber ?? 'N/A'}`, 400, 60, { width: 155, align: 'right' })
    .text(`Order No:   ${order.orderNumber}`, 400, 73, { width: 155, align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 86, { width: 155, align: 'right' });

  // Divider
  doc.moveTo(40, 110).lineTo(555, 110).strokeColor('#ccc').lineWidth(1).stroke();

  // ── Bill To ───────────────────────────────────────────────────────────────
  const customer = order.customer;
  const name = [order.firstName, order.lastName].filter(Boolean).join(' ') || customer?.email || 'Customer';
  doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('Bill To:', 40, 120);
  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(name, 40, 135)
    .text(order.shippingAddress ?? '', 40, 148, { width: 230 });
  if (order.contactNumber) doc.text(`Phone: ${order.contactNumber}`, 40, doc.y + 4);

  if (order.billingAddress && order.billingAddress !== order.shippingAddress) {
    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('Ship To:', 300, 120);
    doc.fontSize(9).font('Helvetica').fillColor('#333')
      .text(order.billingAddress, 300, 135, { width: 255 });
  }

  // ── Items Table ───────────────────────────────────────────────────────────
  const tableTop = 230;
  // Header row
  doc.rect(40, tableTop, W, 18).fill('#f0f0f0');
  doc.fillColor('#000').fontSize(9).font('Helvetica-Bold')
    .text('#', 43, tableTop + 4)
    .text('Product', COL.name + 12, tableTop + 4)
    .text('Qty', COL.qty, tableTop + 4, { width: 50, align: 'center' })
    .text('Price', COL.price, tableTop + 4, { width: 60, align: 'right' })
    .text('Total', COL.total, tableTop + 4, { width: 65, align: 'right' });

  doc.moveTo(40, tableTop + 18).lineTo(555, tableTop + 18).strokeColor('#ccc').stroke();

  let y = tableTop + 22;
  const items: any[] = order.items ?? [];
  items.forEach((item: any, i: number) => {
    const rowH = 20;
    if (i % 2 === 0) doc.rect(40, y - 2, W, rowH).fill('#fafafa');
    doc.fillColor('#000').fontSize(9).font('Helvetica')
      .text(String(i + 1), 43, y)
      .text(item.product?.productName ?? `Product #${item.productId}`, COL.name + 12, y, { width: 250 })
      .text(String(item.quantity), COL.qty, y, { width: 50, align: 'center' })
      .text(`Rs.${item.price.toFixed(2)}`, COL.price, y, { width: 60, align: 'right' })
      .text(`Rs.${item.total.toFixed(2)}`, COL.total, y, { width: 65, align: 'right' });
    y += rowH;
  });

  doc.moveTo(40, y + 2).lineTo(555, y + 2).strokeColor('#ccc').stroke();
  y += 10;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalsX = 380;
  const valX = 490;
  function totRow(label: string, val: string, bold = false) {
    doc.fontSize(9)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor('#000')
      .text(label, totalsX, y, { width: 100, align: 'right' })
      .text(val, valX, y, { width: 65, align: 'right' });
    y += 16;
  }

  totRow('Subtotal:', `Rs.${(order.subtotal ?? 0).toFixed(2)}`);
  totRow('GST / Tax:', `Rs.${(order.tax ?? 0).toFixed(2)}`);
  totRow('Shipping:', `Rs.${(order.shippingCost ?? 0).toFixed(2)}`);
  doc.moveTo(totalsX, y).lineTo(555, y).strokeColor('#999').stroke();
  y += 4;
  totRow('TOTAL:', `Rs.${(order.totalAmount ?? 0).toFixed(2)}`, true);

  // Amount in words
  y += 10;
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#444')
    .text(`Amount in Words: ${toWords(order.totalAmount ?? 0)}`, 40, y, { width: W });

  // Payment method
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Payment Method: ${(order.paymentMethod ?? 'N/A').toUpperCase()}`, 40, y)
    .text(`Payment Status: ${(order.paymentStatus ?? 'N/A').toUpperCase()}`, 220, y);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.moveTo(40, 770).lineTo(555, 770).strokeColor('#ccc').stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#888')
    .text('Thank you for shopping with ScaleUpStores! For queries: support@scaleupstores.com', 40, 776, { align: 'center', width: W });

  doc.end();
  return promise;
}

// ─── Address Label PDF (4 per A4) ────────────────────────────────────────────

const COMPANY_NAME = 'ScaleUpStores';
const COMPANY_ADDRESS = 'No.12, Main Street, Chennai - 600001';
const COMPANY_PHONE = '+91 98765 43210';

export async function generateAddressLabelsPdf(orders: any[]): Promise<Buffer> {
  // A4: 595.28 x 841.89 pt. 4 labels: 2 cols x 2 rows
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 20;
  const LABEL_W = (PAGE_W - MARGIN * 3) / 2;  // ~267pt
  const LABEL_H = (PAGE_H - MARGIN * 3) / 2;  // ~400pt
  const DASH = [4, 3];

  const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
  const promise = bufferFromDoc(doc);

  // Process 4 labels per page
  for (let i = 0; i < orders.length; i++) {
    const posOnPage = i % 4;
    if (i > 0 && posOnPage === 0) doc.addPage();

    const col = posOnPage % 2;
    const row = Math.floor(posOnPage / 2);
    const x = MARGIN + col * (LABEL_W + MARGIN);
    const y = MARGIN + row * (LABEL_H + MARGIN);

    const order = orders[i];
    const recipientName = [order.firstName, order.lastName].filter(Boolean).join(' ') || 'Customer';

    // Label border
    doc.rect(x, y, LABEL_W, LABEL_H).strokeColor('#aaa').lineWidth(0.5).stroke();

    // Cut guides (dashed lines between labels)
    if (col === 0 && orders.length > 1) {
      const midX = MARGIN + LABEL_W + MARGIN / 2;
      doc.moveTo(midX, MARGIN / 2)
        .lineTo(midX, PAGE_H - MARGIN / 2)
        .dash(DASH[0], { space: DASH[1] })
        .strokeColor('#bbb').lineWidth(0.5).stroke();
      doc.undash();
    }
    if (row === 0 && orders.length > 2) {
      const midY = MARGIN + LABEL_H + MARGIN / 2;
      doc.moveTo(MARGIN / 2, midY)
        .lineTo(PAGE_W - MARGIN / 2, midY)
        .dash(DASH[0], { space: DASH[1] })
        .strokeColor('#bbb').lineWidth(0.5).stroke();
      doc.undash();
    }

    let ly = y + 10;
    const lx = x + 10;
    const lw = LABEL_W - 20;

    // Order number badge
    doc.rect(lx, ly, lw, 14).fill('#222');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#fff')
      .text(`ORDER: ${order.orderNumber}`, lx + 4, ly + 3, { width: lw - 8 });
    ly += 20;

    // FROM
    doc.fillColor('#000').fontSize(7).font('Helvetica-Bold').text('FROM:', lx, ly);
    ly += 11;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#222').text(COMPANY_NAME, lx, ly);
    ly += 11;
    doc.fontSize(7.5).font('Helvetica').fillColor('#333')
      .text(COMPANY_ADDRESS, lx, ly, { width: lw })
      .text(`Ph: ${COMPANY_PHONE}`, lx, doc.y + 2);
    ly = doc.y + 10;

    // Divider
    doc.moveTo(lx, ly).lineTo(x + LABEL_W - 10, ly).strokeColor('#ccc').lineWidth(0.5).stroke();
    ly += 8;

    // TO
    doc.fillColor('#000').fontSize(7).font('Helvetica-Bold').text('TO:', lx, ly);
    ly += 11;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(recipientName, lx, ly);
    ly += 13;
    if (order.contactNumber) {
      doc.fontSize(8).font('Helvetica').fillColor('#333').text(`Ph: ${order.contactNumber}`, lx, ly);
      ly += 11;
    }
    doc.fontSize(8).font('Helvetica').fillColor('#333')
      .text(order.shippingAddress ?? '', lx, ly, { width: lw });
    ly = doc.y + 10;

    // Divider
    doc.moveTo(lx, ly).lineTo(x + LABEL_W - 10, ly).strokeColor('#ccc').lineWidth(0.5).stroke();
    ly += 8;

    // Product list
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000').text('Items:', lx, ly);
    ly += 10;
    const items: any[] = order.items ?? [];
    items.slice(0, 6).forEach((item: any) => {
      const pName = item.product?.productName ?? `Product #${item.productId}`;
      doc.fontSize(7.5).font('Helvetica').fillColor('#333')
        .text(`• ${pName} x${item.quantity}`, lx + 4, ly, { width: lw - 4 });
      ly = doc.y + 2;
    });
    if (items.length > 6) {
      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#888')
        .text(`... and ${items.length - 6} more item(s)`, lx + 4, ly);
    }

    // Total at bottom of label
    const totalY = y + LABEL_H - 22;
    doc.rect(lx, totalY, lw, 14).fill('#f5f5f5');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
      .text(`Total: Rs.${(order.totalAmount ?? 0).toFixed(2)}  |  ${(order.paymentMethod ?? '').toUpperCase()}`,
        lx + 4, totalY + 3, { width: lw - 8 });
  }

  doc.end();
  return promise;
}
