import { Transaction, StoreSettings, Customer } from '../types';
import { formatRupiah } from './storage';
import { terbilang } from './terbilang';
import QRCode from 'qrcode';

export interface ReceiptRenderOptions {
  transaction: Transaction;
  settings: StoreSettings;
  customer?: Customer | null;
  mode?: 'struk' | 'kuitansi';
}

/**
 * Draw the official Koperasi Sabang Prima Meujaya circular emblem
 */
function drawKoperasiLogo(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.save();

  // 1. Outer Dark Ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // 2. Middle Ring (Gold/Amber border)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // 3. Inner Circle (Warm Golden Amber Emblem Background)
  const innerRadius = radius - 11;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, innerRadius);
  grad.addColorStop(0, '#fbbf24'); // Amber gold
  grad.addColorStop(0.7, '#f59e0b');
  grad.addColorStop(1, '#d97706');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Center Island Silhouette (Aceh & Sabang Map graphic)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  // Stylized island contour
  ctx.ellipse(centerX - 2, centerY - 2, innerRadius * 0.55, innerRadius * 0.42, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Sabang island dot at northern tip
  ctx.beginPath();
  ctx.arc(centerX + innerRadius * 0.32, centerY - innerRadius * 0.45, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();
  ctx.restore();

  // 5. Center Ribbon
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.8;
  const ribbonW = innerRadius * 1.5;
  const ribbonH = 8.5;
  ctx.fillRect(centerX - ribbonW / 2, centerY + 2, ribbonW, ribbonH);
  ctx.strokeRect(centerX - ribbonW / 2, centerY + 2, ribbonW, ribbonH);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PELAYANAN PRIMA • ANGGOTA MEUJAYA', centerX, centerY + 8.5);
  ctx.restore();

  // 6. Curved Text on Outer Ring
  // Top: KOPERASI SABANG PRIMA MEUJAYA
  const topText = 'KOPERASI SABANG PRIMA MEUJAYA';
  ctx.font = `bold ${Math.max(6, Math.round(radius * 0.17))}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  const textRadius = radius - 6.5;
  const topAngleSpan = Math.PI * 1.1; // arc span
  const topStartAngle = -Math.PI / 2 - topAngleSpan / 2;
  const topStep = topAngleSpan / (topText.length - 1);

  for (let i = 0; i < topText.length; i++) {
    const angle = topStartAngle + i * topStep;
    ctx.save();
    ctx.translate(centerX + textRadius * Math.cos(angle), centerY + textRadius * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(topText[i], 0, 0);
    ctx.restore();
  }

  // Bottom: • SABANG - ACEH • EST 2026 •
  const btmText = '• SABANG - ACEH • EST 2026 •';
  ctx.font = `bold ${Math.max(5.5, Math.round(radius * 0.15))}px "Plus Jakarta Sans", sans-serif`;
  const btmAngleSpan = Math.PI * 0.8;
  const btmStartAngle = Math.PI / 2 + btmAngleSpan / 2;
  const btmStep = btmAngleSpan / (btmText.length - 1);

  for (let i = 0; i < btmText.length; i++) {
    const angle = btmStartAngle - i * btmStep;
    ctx.save();
    ctx.translate(centerX + textRadius * Math.cos(angle), centerY + textRadius * Math.sin(angle));
    ctx.rotate(angle - Math.PI / 2);
    ctx.fillText(btmText[i], 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw paper sawtooth cut edges (thermal roll cut)
 */
function drawSawtoothEdge(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  isTop: boolean
): void {
  ctx.save();
  const toothWidth = 12;
  const toothDepth = 6;
  const count = Math.ceil(width / toothWidth);

  ctx.fillStyle = '#0f172a'; // dark canvas frame border outside paper
  ctx.beginPath();
  if (isTop) {
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, y);
    for (let i = count; i >= 0; i--) {
      const x = i * toothWidth;
      ctx.lineTo(x - toothWidth / 2, y + toothDepth);
      ctx.lineTo(x - toothWidth, y);
    }
  } else {
    ctx.moveTo(0, y);
    for (let i = 0; i <= count; i++) {
      const x = i * toothWidth;
      ctx.lineTo(x + toothWidth / 2, y - toothDepth);
      ctx.lineTo(x + toothWidth, y);
    }
    ctx.lineTo(width, y + 50);
    ctx.lineTo(0, y + 50);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 1. RENDER STRUK THERMAL - PERSIS SEPERTI FOTO (JPG)
 */
export function renderReceiptToCanvas(
  options: ReceiptRenderOptions
): HTMLCanvasElement {
  const { transaction, settings } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const width = 480;
  const scale = 2; // Retina sharpness
  const padding = 28;

  // Calculate dynamic items height
  const itemsHeight = transaction.items.length * 48;
  const qrSectionHeight = 150;
  const calculatedHeight = 430 + itemsHeight + qrSectionHeight;

  canvas.width = width * scale;
  canvas.height = calculatedHeight * scale;
  ctx.scale(scale, scale);

  // Thermal Paper Clean White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, calculatedHeight);

  // 1. Top Jagged Paper Cut Edge
  drawSawtoothEdge(ctx, width, 10, true);

  let y = 32;

  // 2. Header Texts (Store Name & Address - Tanpa Logo & Tanpa Angka Panjang)
  // Store Name (Bold, prominent)
  ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText(settings.storeName || 'Koperasi Sabang Prima Meujaya', width / 2, y);
  y += 24;

  // Address Line 1
  ctx.font = '13.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('V8V9+64F, Jl. Teuku Umar No. 10, Kuta', width / 2, y);
  y += 18;

  // Address Line 2
  ctx.fillText('Ateueh, Sukakarya, Kota Sabang, Aceh', width / 2, y);
  y += 20;

  // Dashed Line Helper
  const drawDashedLine = () => {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.restore();
    y += 18;
  };

  // 3. Divider 1
  drawDashedLine();

  // 4. Metadata (Hanya Tanggal & Jam - Tanpa No. Struk di atas tanggal & Tanpa Kasir)
  const dateObj = new Date(transaction.date);
  const formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedTime = dateObj.toTimeString().split(' ')[0]; // HH:mm:ss

  ctx.font = '14px "Space Mono", monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText(formattedDate, padding, y);
  y += 20;

  ctx.fillText(formattedTime, padding, y);
  y += 18;

  // 5. Divider 2
  drawDashedLine();

  // 7. Numbered Items List
  transaction.items.forEach((item, index) => {
    // Line 1: Item Name in BOLD ALL-CAPS
    ctx.font = 'bold 14.5px "Space Mono", monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(`${index + 1}. ${item.productName.toUpperCase()}`, padding, y);
    y += 20;

    // Line 2: Qty x UnitPrice (left) and Subtotal (right)
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText(`   ${item.quantity} x ${formatRupiah(item.price)}`, padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatRupiah(item.subtotal), width - padding, y);
    y += 24;
  });

  // 8. Divider 3
  drawDashedLine();

  // 9. Totals Section
  const totalQty = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  // Total QTY
  ctx.font = '14.5px "Space Mono", monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText(`Total QTY : ${totalQty}`, padding, y);
  y += 22;

  // Sub Total
  ctx.fillText('Sub Total', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(transaction.subtotal), width - padding, y);
  y += 22;

  // Discount (if any)
  if (transaction.discount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText('Diskon', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-${formatRupiah(transaction.discount)}`, width - padding, y);
    y += 22;
  }

  // Big Bold Total
  y += 4;
  ctx.font = 'bold 17px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Total', padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(transaction.total), width - padding, y);
  y += 24;

  // Payment Method Row
  const isUnpaid = transaction.paymentStatus === 'belum_bayar';
  const payLabel =
    isUnpaid ? 'Bayar (Tempo)' :
    transaction.paymentMethod === 'tunai' ? 'Bayar (Cash)' :
    transaction.paymentMethod === 'qris' ? 'Bayar (QRIS)' :
    transaction.paymentMethod === 'transfer' ? 'Bayar (Transfer)' : 'Bayar (Debit)';

  const paidAmount = isUnpaid ? (transaction.paidAmount || 0) : (transaction.cashAmount || transaction.total);

  ctx.font = '14.5px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(payLabel, padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(paidAmount), width - padding, y);
  y += 22;

  // If cash and change exists
  if (transaction.paymentMethod === 'tunai' && !isUnpaid && transaction.changeAmount !== undefined) {
    ctx.textAlign = 'left';
    ctx.fillText('Kembali', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatRupiah(transaction.changeAmount), width - padding, y);
    y += 22;
  }

  // If unpaid: show remaining amount and due date
  if (isUnpaid) {
    ctx.font = 'bold 14px "Space Mono", monospace';
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'left';
    ctx.fillText('Sisa Belum Bayar', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatRupiah(transaction.remainingAmount ?? transaction.total), width - padding, y);
    y += 20;

    if (transaction.dueDate) {
      ctx.font = '12.5px "Space Mono", monospace';
      ctx.fillText(`Jatuh Tempo: ${transaction.dueDate}`, width - padding, y);
      y += 20;
    }
    ctx.fillStyle = '#000000';
  }

  // 10. Divider 4
  y += 4;
  drawDashedLine();

  // 11. Slogan Text (Dibuat dua baris rapi dan proporsional agar tidak kepanjangan)
  const rawFooter = (settings.receiptFooter || 'Pelayanan Prima,\nAnggota Meujaya').trim();
  let footerLines: string[] = [];
  
  if (rawFooter.includes('\n')) {
    footerLines = rawFooter.split('\n').map((s) => s.trim()).filter(Boolean);
  } else if (rawFooter.includes(',')) {
    const parts = rawFooter.split(',');
    footerLines = [
      parts[0].trim() + (parts.length > 1 ? ',' : ''),
      parts.slice(1).join(',').trim()
    ].filter(Boolean);
  } else {
    const words = rawFooter.split(' ');
    if (words.length > 2) {
      const mid = Math.ceil(words.length / 2);
      footerLines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
    } else {
      footerLines = [rawFooter];
    }
  }

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  for (const fLine of footerLines) {
    ctx.fillText(fLine, width / 2, y);
    y += 20;
  }
  y += 8;

  // 12. Real Crisp QR Code
  try {
    const qrPayload = `https://koperasi.sabang.id/receipt/${transaction.invoiceNumber}`;
    const qrData = QRCode.create(qrPayload, { errorCorrectionLevel: 'M' });
    const numCells = qrData.modules.size;
    const cellSize = Math.floor(120 / numCells);
    const qrSize = cellSize * numCells;
    const startX = Math.round((width - qrSize) / 2);

    ctx.fillStyle = '#000000';
    for (let r = 0; r < numCells; r++) {
      for (let c = 0; c < numCells; c++) {
        if (qrData.modules.get(r, c)) {
          ctx.fillRect(startX + c * cellSize, y + r * cellSize, cellSize, cellSize);
        }
      }
    }
    y += qrSize + 24;
  } catch (err) {
    console.error('QR code error:', err);
    y += 120;
  }

  // 13. Bottom Jagged Paper Cut Edge
  drawSawtoothEdge(ctx, width, calculatedHeight - 12, false);

  return canvas;
}

/**
 * 2. RENDER KUITANSI RESMI KOPERASI SABANG PRIMA MEUJAYA (JPG)
 * Sesuai instruksi:
 * - Logo & Nama Koperasi sama persis
 * - Tanpa Alamat
 * - Tanpa Cap Hijau & Tanpa Cap Biru
 * - Tanda tangan: ( Pengurus Koperasi ) dengan ruang kosong untuk ttd & cap manual
 */
export function renderKuitansiToCanvas(
  options: ReceiptRenderOptions
): HTMLCanvasElement {
  const { transaction, settings } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const width = 850;
  const scale = 2; // Sharp print resolution
  const padding = 50;

  const itemsHeight = transaction.items.length * 36;
  const calculatedHeight = 650 + itemsHeight;

  canvas.width = width * scale;
  canvas.height = calculatedHeight * scale;
  ctx.scale(scale, scale);

  // Elegant Clean White Certificate Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, calculatedHeight);

  // Outer Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(20, 20, width - 40, calculatedHeight - 40);

  // Inner Fine Border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, width - 52, calculatedHeight - 52);

  let y = 52;

  // 1. Logo & Header Koperasi
  drawKoperasiLogo(ctx, padding + 46, y + 42, 42);

  // Header Title
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText(settings.storeName || 'Koperasi Sabang Prima Meujaya', padding + 106, y + 30);

  ctx.font = 'italic 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Pelayanan Prima, Anggota Meujaya', padding + 106, y + 50);

  // Badge KUITANSI RESMI on top right
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('KUITANSI PEMBAYARAN', width - padding, y + 32);

  ctx.font = '12px "Space Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`No: ${transaction.invoiceNumber}`, width - padding, y + 52);

  y += 95;

  // Dividing Line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 24;

  // 2. Kuitansi Fields
  const drawKuitansiField = (label: string, value: string, isBig = false) => {
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(label, padding, y);

    ctx.font = isBig ? 'bold 15px "Plus Jakarta Sans", sans-serif' : '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`:  ${value}`, padding + 180, y);
    y += 26;
  };

  const recipient =
    transaction.customerDepartment ||
    transaction.customerName ||
    'Bagian Umum & Keperluan Kantor';

  drawKuitansiField('Telah Diterima Dari', recipient, true);

  const terbilangText = `# ${terbilang(transaction.total)} Rupiah #`;
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('Uang Sejumlah', padding, y);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(padding + 180, y - 14, width - padding * 2 - 180, 24);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding + 180, y - 14, width - padding * 2 - 180, 24);

  ctx.font = 'italic bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#065f46';
  ctx.fillText(terbilangText, padding + 190, y + 2);
  y += 32;

  const purpose =
    transaction.officialPurpose ||
    transaction.notes ||
    `Pembelian / Pengadaan Konsumsi & Barang ${recipient}`;
  drawKuitansiField('Untuk Pembayaran', purpose);

  y += 8;

  // 3. Table of Items
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(padding, y, width - padding * 2, 24);
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText('NO', padding + 10, y + 16);
  ctx.fillText('NAMA BARANG / KEPERLUAN', padding + 45, y + 16);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', width - padding - 220, y + 16);
  ctx.textAlign = 'right';
  ctx.fillText('HARGA', width - padding - 120, y + 16);
  ctx.fillText('SUBTOTAL', width - padding - 10, y + 16);
  y += 30;

  transaction.items.forEach((item, idx) => {
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText(`${idx + 1}.`, padding + 10, y);
    ctx.fillText(item.productName, padding + 45, y);

    ctx.textAlign = 'center';
    ctx.fillText(`${item.quantity} ${item.unit}`, width - padding - 220, y);

    ctx.textAlign = 'right';
    ctx.fillText(formatRupiah(item.price), width - padding - 120, y);
    ctx.fillText(formatRupiah(item.subtotal), width - padding - 10, y);
    y += 24;
  });

  // 4. Total Box (Left) & Signature Area (Right)
  y += 18;
  const totalBoxY = y;

  // Total Box
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(padding, totalBoxY, 260, 48);
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL PEMBAYARAN', padding + 18, totalBoxY + 18);

  ctx.font = 'bold 18px "Space Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(formatRupiah(transaction.total), padding + 18, totalBoxY + 38);

  // Status Indicator if Belum Bayar
  if (transaction.paymentStatus === 'belum_bayar') {
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.fillStyle = '#b45309';
    ctx.fillText(`* STATUS: BELUM LUNAS (TEMPO: ${transaction.dueDate || '-'})`, padding, totalBoxY + 68);
  }

  // Signature Block on the right:
  // "Sabang, [Tanggal]"
  // "Penerima / Pengurus Koperasi,"
  // [LAPANG / KOSONG UNTUK TTD & CAP FISIK ASLI MANUAL]
  // "( Pengurus Koperasi )"
  // "Koperasi Sabang Prima Meujaya"
  const signX = width - padding - 120;
  const dateObj = new Date(transaction.date);
  const dateFormatted = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.fillText(`Sabang, ${dateFormatted}`, signX, y + 10);
  ctx.fillText('Penerima / Pengurus Koperasi,', signX, y + 26);

  // Generous empty space for real physical pen signature and ink stamp
  y += 105;

  ctx.font = 'bold 12.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('( Pengurus Koperasi )', signX, y);
  y += 18;

  ctx.font = '10.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(settings.storeName || 'Koperasi Sabang Prima Meujaya', signX, y);

  return canvas;
}

export function getReceiptJpgDataUrl(options: ReceiptRenderOptions): string {
  const canvas = options.mode === 'kuitansi' ? renderKuitansiToCanvas(options) : renderReceiptToCanvas(options);
  return canvas.toDataURL('image/jpeg', 0.95);
}

export function getReceiptBlob(options: ReceiptRenderOptions): Promise<Blob> {
  const canvas = options.mode === 'kuitansi' ? renderKuitansiToCanvas(options) : renderReceiptToCanvas(options);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Download functions specifically exporting as .JPG
 */
export function downloadReceiptAsJpg(options: ReceiptRenderOptions): string {
  const canvas = renderReceiptToCanvas(options);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  const link = document.createElement('a');
  link.download = `Struk-${options.transaction.invoiceNumber}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

export function downloadKuitansiAsJpg(options: ReceiptRenderOptions): string {
  const canvas = renderKuitansiToCanvas(options);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  const link = document.createElement('a');
  link.download = `Kuitansi-Resmi-${options.transaction.invoiceNumber}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

