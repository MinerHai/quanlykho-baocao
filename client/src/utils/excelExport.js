import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export const STORE_NAME = 'HẢI HƯƠNG';
export const STORE_SUB = 'Hệ thống quản lý kho';

const NAVY = 'FF1E3A5F';
const LIGHT = 'FFEAF1FB';
const GREY = 'FFF1F5F9';
const THIN = { style: 'thin', color: { argb: 'FF94A3B8' } };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const NUM_FMT = { money: '#,##0', int: '#,##0', datetime: 'dd/mm/yyyy hh:mm', date: 'dd/mm/yyyy' };
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// exceljs nặng (~1MB) nên chỉ tải khi người dùng bấm xuất
const loadExcelJS = async () => {
    const mod = await import('exceljs');
    return mod.default || mod;
};

export const formatDateTime = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '');
export const formatDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '');
export const formatMoney = (n) => `${Math.round(Number(n) || 0).toLocaleString('vi-VN')}`;

export const IMPORT_STATUS = { draft: 'Nháp', pending: 'Chờ duyệt', completed: 'Đã nhập', cancelled: 'Đã hủy' };
export const EXPORT_STATUS = { draft: 'Nháp', pending: 'Chờ duyệt', completed: 'Đã xuất', cancelled: 'Đã hủy' };
export const EXPORT_TYPE = {
    sale: 'Bán hàng',
    return_supplier: 'Trả NCC',
    damaged: 'Hàng hỏng',
    transfer: 'Chuyển kho',
    other: 'Khác',
};

/* ====================== Đọc số thành chữ (tiếng Việt) ====================== */
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

const readTriple = (n, full) => {
    const tram = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const donvi = n % 10;
    let s = '';
    if (full || tram > 0) s += `${DIGITS[tram]} trăm`;
    if (chuc > 1) {
        s += ` ${DIGITS[chuc]} mươi`;
        if (donvi === 1) s += ' mốt';
        else if (donvi === 4) s += ' tư';
        else if (donvi === 5) s += ' lăm';
        else if (donvi > 0) s += ` ${DIGITS[donvi]}`;
    } else if (chuc === 1) {
        s += ' mười';
        if (donvi === 5) s += ' lăm';
        else if (donvi > 0) s += ` ${DIGITS[donvi]}`;
    } else if (donvi > 0) {
        if (full || tram > 0) s += ' lẻ';
        s += ` ${DIGITS[donvi]}`;
    }
    return s.trim();
};

export const numberToVietnameseWords = (value) => {
    const num = Math.round(Number(value) || 0);
    if (num === 0) return 'Không đồng';
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    const groups = [];
    let n = Math.abs(num);
    while (n > 0) {
        groups.push(n % 1000);
        n = Math.floor(n / 1000);
    }
    const parts = [];
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] === 0) continue;
        const full = i < groups.length - 1;
        parts.push(`${readTriple(groups[i], full)} ${units[i]}`.trim());
    }
    const text = parts.join(' ').replace(/\s+/g, ' ').trim();
    return `${num < 0 ? 'Âm ' : ''}${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
};

/* ============================ Workbook helpers ============================ */
export const createWorkbook = async () => {
    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    wb.creator = STORE_NAME;
    wb.created = new Date();
    return wb;
};

export const downloadWorkbook = async (wb, filename) => {
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: XLSX_MIME }), filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

const autoWidth = (col, rows) => {
    const longest = Math.max(
        String(col.header).length,
        ...rows.map((r) => {
            const v = r[col.key];
            if (v instanceof Date) return 16;
            if (typeof v === 'number') return formatMoney(v).length;
            return String(v ?? '').length;
        }),
    );
    return Math.min(Math.max(longest + 3, 8), 48);
};

const styleCell = (cell, type) => {
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (type === 'money' || type === 'int') {
        cell.numFmt = NUM_FMT[type];
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (type === 'datetime' || type === 'date') {
        cell.numFmt = NUM_FMT[type];
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (type === 'center') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
};

const addLetterhead = (ws, colCount, title, subtitle) => {
    const last = Math.max(colCount, 2);
    ws.mergeCells(1, 1, 1, last);
    ws.getCell(1, 1).value = STORE_NAME;
    ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: NAVY } };
    ws.mergeCells(2, 1, 2, last);
    ws.getCell(2, 1).value = STORE_SUB;
    ws.getCell(2, 1).font = { italic: true, size: 10, color: { argb: 'FF64748B' } };

    ws.mergeCells(4, 1, 4, last);
    const t = ws.getCell(4, 1);
    t.value = String(title).toUpperCase();
    t.font = { bold: true, size: 16, color: { argb: NAVY } };
    t.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(4).height = 28;

    if (subtitle) {
        ws.mergeCells(5, 1, 5, last);
        const s = ws.getCell(5, 1);
        s.value = subtitle;
        s.font = { italic: true, size: 11 };
        s.alignment = { horizontal: 'center' };
    }
};

const addSignatures = (ws, colCount, labels, startRow) => {
    const per = Math.max(Math.floor(colCount / labels.length), 1);
    ws.getRow(startRow).height = 18;
    labels.forEach((label, i) => {
        const from = i * per + 1;
        const to = i === labels.length - 1 ? colCount : (i + 1) * per;
        if (to > from) ws.mergeCells(startRow, from, startRow, to);
        const c = ws.getCell(startRow, from);
        c.value = label;
        c.font = { bold: true };
        c.alignment = { horizontal: 'center' };
        if (to > from) ws.mergeCells(startRow + 1, from, startRow + 1, to);
        const n = ws.getCell(startRow + 1, from);
        n.value = '(Ký, ghi rõ họ tên)';
        n.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
        n.alignment = { horizontal: 'center' };
    });
};

/**
 * Thêm 1 sheet dạng bảng có định dạng chuẩn.
 * columns: [{ header, key, width?, type?: 'text'|'int'|'money'|'date'|'datetime'|'center' }]
 * totals:  { label, keys: ['quantity', 'amount'] }  -> dòng "TỔNG CỘNG"
 * plain:   true  -> không tiêu đề/chữ ký, header ở dòng 1 (để file còn đọc lại bằng chức năng Import)
 */
export const addTableSheet = (wb, opts) => {
    const { name, title, subtitle, columns, rows, totals, plain = false, signatures = true } = opts;
    const ws = wb.addWorksheet(String(name).slice(0, 31), {
        pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    ws.columns = columns.map((c) => ({ key: c.key, width: c.width || autoWidth(c, rows) }));

    let headerRow = 1;
    if (!plain) {
        addLetterhead(ws, columns.length, title || name, subtitle);
        headerRow = 7;
    }

    const h = ws.getRow(headerRow);
    columns.forEach((c, i) => {
        const cell = h.getCell(i + 1);
        cell.value = c.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = BORDER;
    });
    h.height = 24;

    rows.forEach((r, idx) => {
        const row = ws.getRow(headerRow + 1 + idx);
        columns.forEach((c, i) => {
            const cell = row.getCell(i + 1);
            const v = r[c.key];
            cell.value = v === undefined || v === null ? '' : v;
            styleCell(cell, c.type);
            if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
        });
    });

    let nextRow = headerRow + rows.length + 1;
    if (totals && rows.length > 0) {
        const row = ws.getRow(nextRow);
        const totalRows = totals.include ? rows.filter(totals.include) : rows;
        columns.forEach((c, i) => {
            const cell = row.getCell(i + 1);
            if (i === 0) cell.value = totals.label || 'TỔNG CỘNG';
            if (totals.keys.includes(c.key)) cell.value = totalRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
            styleCell(cell, totals.keys.includes(c.key) ? c.type : undefined);
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
        });
        const labelEnd = columns.findIndex((c) => totals.keys.includes(c.key));
        if (labelEnd > 1) ws.mergeCells(nextRow, 1, nextRow, labelEnd);
        nextRow += 1;
    }

    ws.views = [{ state: 'frozen', ySplit: headerRow }];
    if (rows.length > 0) {
        ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: columns.length } };
    }

    if (!plain && signatures && columns.length >= 4) {
        nextRow += 1;
        const dateRow = ws.getRow(nextRow);
        dateRow.getCell(columns.length).value = `Ngày xuất báo cáo: ${dayjs().format('DD/MM/YYYY HH:mm')}`;
        dateRow.getCell(columns.length).font = { italic: true, size: 10 };
        dateRow.getCell(columns.length).alignment = { horizontal: 'right' };
        addSignatures(ws, columns.length, ['Người lập biểu', 'Thủ kho', 'Kế toán'], nextRow + 2);
    }
    return ws;
};

/* ================================ Hóa đơn ================================ */
const buildInvoice = (kind, doc) => {
    const isExport = kind === 'export';
    const items = (doc.items || []).map((it, i) => {
        const price = isExport ? it.exportPrice : it.importPrice;
        return {
            stt: i + 1,
            sku: it.sku || it.product?.sku || '',
            name: it.productName || it.product?.name || '',
            quantity: Number(it.quantity) || 0,
            price: Number(price) || 0,
            total: Number(it.totalPrice) || (Number(it.quantity) || 0) * (Number(price) || 0),
        };
    });
    const totalAmount = Number(doc.totalAmount) || items.reduce((s, i) => s + i.total, 0);
    const totalQty = Number(doc.totalItems) || items.reduce((s, i) => s + i.quantity, 0);
    const date = isExport ? doc.exportDate || doc.createdAt : doc.importDate || doc.createdAt;

    const party = isExport
        ? [
              ['Người nhận / Khách hàng', doc.receiver || '—'],
              ['Loại xuất', EXPORT_TYPE[doc.type] || doc.type || '—'],
          ]
        : [
              ['Nhà cung cấp', doc.supplier?.name || '—'],
              ['Điện thoại', doc.supplier?.phone || '—'],
              ['Địa chỉ', doc.supplier?.address || '—'],
          ];

    return {
        title: isExport ? 'Hóa đơn xuất kho' : 'Phiếu nhập kho',
        code: doc.code,
        dateText: formatDateTime(date),
        status: (isExport ? EXPORT_STATUS : IMPORT_STATUS)[doc.status] || doc.status || '',
        party,
        createdBy: doc.createdBy?.fullName || '',
        priceLabel: isExport ? 'Đơn giá xuất' : 'Đơn giá nhập',
        items,
        totalAmount,
        totalQty,
        words: numberToVietnameseWords(totalAmount),
        note: doc.note || '',
        signatures: isExport
            ? ['Người lập phiếu', 'Người nhận hàng', 'Thủ kho', 'Kế toán']
            : ['Người lập phiếu', 'Người giao hàng', 'Thủ kho', 'Kế toán'],
    };
};

/** Xuất hóa đơn / phiếu của 1 đơn ra file Excel (1 sheet, đúng form chứng từ). */
export const exportInvoiceExcel = async (kind, doc) => {
    const inv = buildInvoice(kind, doc);
    const wb = await createWorkbook();
    const ws = wb.addWorksheet('Hóa đơn', {
        pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    ws.columns = [{ width: 6 }, { width: 16 }, { width: 38 }, { width: 10 }, { width: 18 }, { width: 20 }];
    addLetterhead(ws, 6, inv.title, `Số: ${inv.code}   |   Ngày: ${inv.dateText}`);

    let r = 7;
    const info = [...inv.party, ['Trạng thái', inv.status], ['Người lập', inv.createdBy || '—']];
    info.forEach(([label, value]) => {
        ws.getCell(r, 1).value = label;
        ws.mergeCells(r, 1, r, 2);
        ws.getCell(r, 1).font = { bold: true };
        ws.getCell(r, 3).value = value;
        ws.mergeCells(r, 3, r, 6);
        r += 1;
    });
    r += 1;

    const heads = ['STT', 'Mã SP', 'Tên sản phẩm', 'SL', inv.priceLabel, 'Thành tiền'];
    heads.forEach((t, i) => {
        const c = ws.getCell(r, i + 1);
        c.value = t;
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = BORDER;
    });
    ws.getRow(r).height = 22;
    r += 1;

    inv.items.forEach((it, idx) => {
        [it.stt, it.sku, it.name, it.quantity, it.price, it.total].forEach((v, i) => {
            const c = ws.getCell(r, i + 1);
            c.value = v;
            styleCell(c, i === 0 ? 'center' : i >= 3 ? (i === 3 ? 'int' : 'money') : undefined);
            if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
        });
        r += 1;
    });

    ws.getCell(r, 1).value = 'TỔNG CỘNG';
    ws.mergeCells(r, 1, r, 3);
    ws.getCell(r, 4).value = inv.totalQty;
    ws.getCell(r, 6).value = inv.totalAmount;
    for (let i = 1; i <= 6; i++) {
        const c = ws.getCell(r, i);
        styleCell(c, i === 4 ? 'int' : i === 6 ? 'money' : undefined);
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    }
    r += 2;

    ws.getCell(r, 1).value = `Bằng chữ: ${inv.words}`;
    ws.mergeCells(r, 1, r, 6);
    ws.getCell(r, 1).font = { italic: true, bold: true };
    r += 1;
    if (inv.note) {
        ws.getCell(r, 1).value = `Ghi chú: ${inv.note}`;
        ws.mergeCells(r, 1, r, 6);
        r += 1;
    }
    r += 1;
    addSignatures(ws, 6, inv.signatures.slice(0, 3), r);

    await downloadWorkbook(wb, `${kind === 'export' ? 'Hoa_don_xuat' : 'Phieu_nhap'}_${inv.code}`);
};

const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const invoiceHtml = (inv) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(inv.title)} ${esc(inv.code)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", serif; color: #111; font-size: 13px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1E3A5F; padding-bottom: 8px; }
  .shop b { font-size: 18px; color: #1E3A5F; }
  .shop div { font-size: 12px; color: #475569; }
  .meta { text-align: right; font-size: 12px; }
  h1 { text-align: center; margin: 16px 0 4px; font-size: 22px; color: #1E3A5F; text-transform: uppercase; }
  .sub { text-align: center; font-style: italic; margin-bottom: 14px; }
  .info td { padding: 2px 6px 2px 0; vertical-align: top; }
  .info td:first-child { width: 170px; font-weight: bold; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.items th { background: #1E3A5F; color: #fff; padding: 6px; border: 1px solid #1E3A5F; }
  table.items td { padding: 5px 6px; border: 1px solid #94A3B8; }
  table.items tr:nth-child(even) td { background: #F1F5F9; }
  .r { text-align: right; } .c { text-align: center; }
  tr.total td { font-weight: bold; background: #EAF1FB !important; }
  .words { margin-top: 10px; font-style: italic; font-weight: bold; }
  .sign { display: flex; justify-content: space-around; margin-top: 28px; text-align: center; }
  .sign div { width: 22%; } .sign small { color: #64748B; font-style: italic; }
  .sign .space { height: 70px; }
</style></head><body>
<div class="head">
  <div class="shop"><b>${esc(STORE_NAME)}</b><div>${esc(STORE_SUB)}</div></div>
  <div class="meta">Số: <b>${esc(inv.code)}</b><br>Ngày: ${esc(inv.dateText)}<br>Trạng thái: ${esc(inv.status)}</div>
</div>
<h1>${esc(inv.title)}</h1>
<div class="sub">Số: ${esc(inv.code)}</div>
<table class="info">
  ${inv.party.map(([l, v]) => `<tr><td>${esc(l)}:</td><td>${esc(v)}</td></tr>`).join('')}
  <tr><td>Người lập:</td><td>${esc(inv.createdBy || '—')}</td></tr>
</table>
<table class="items">
  <thead><tr><th style="width:36px">STT</th><th style="width:90px">Mã SP</th><th>Tên sản phẩm</th><th style="width:60px">SL</th><th style="width:110px">${esc(inv.priceLabel)}</th><th style="width:120px">Thành tiền</th></tr></thead>
  <tbody>
    ${inv.items
        .map(
            (it) =>
                `<tr><td class="c">${it.stt}</td><td>${esc(it.sku)}</td><td>${esc(it.name)}</td><td class="r">${formatMoney(it.quantity)}</td><td class="r">${formatMoney(it.price)}</td><td class="r">${formatMoney(it.total)}</td></tr>`,
        )
        .join('')}
    <tr class="total"><td colspan="3" class="c">TỔNG CỘNG</td><td class="r">${formatMoney(inv.totalQty)}</td><td></td><td class="r">${formatMoney(inv.totalAmount)}</td></tr>
  </tbody>
</table>
<div class="words">Bằng chữ: ${esc(inv.words)}</div>
${inv.note ? `<div style="margin-top:6px">Ghi chú: ${esc(inv.note)}</div>` : ''}
<div class="sign">${inv.signatures.map((s) => `<div><b>${esc(s)}</b><br><small>(Ký, ghi rõ họ tên)</small><div class="space"></div></div>`).join('')}</div>
</body></html>`;

/** Mở hộp thoại in (chọn "Lưu thành PDF" để có file PDF). Dùng iframe ẩn nên không bị chặn popup. */
export const printInvoice = (kind, doc) => {
    const inv = buildInvoice(kind, doc);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';

    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    let printed = false;
    iframe.onload = () => {
        const win = iframe.contentWindow;
        // Bỏ qua lần load about:blank ban đầu, chỉ in khi hóa đơn đã nạp xong
        if (printed || !win?.document?.querySelector('.head')) return;
        printed = true;
        win.onafterprint = cleanup;
        win.focus();
        win.print();
        setTimeout(cleanup, 120000);
    };
    iframe.srcdoc = invoiceHtml(inv);
    document.body.appendChild(iframe);
};
