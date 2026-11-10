# Client - Hệ thống quản lý kho Hải Hương

Giao diện web viết bằng **React 18 + Vite**, **Ant Design 5** và **TailwindCSS 4**.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
```

Client gọi API ở `http://localhost:3000/api` (xem `src/api/axiosClient.js`), nên cần chạy server trước. Hướng dẫn đầy đủ nằm ở [README gốc](../README.md) và [server/README.md](../server/README.md).

## Cấu trúc `src/`

| Thư mục | Nội dung |
|---|---|
| `api/` | `axiosClient.js`: axios dùng chung, tự refresh token khi gặp 401 |
| `context/` | `AuthContext.jsx`: đăng nhập, đăng ký (tài khoản mới chờ duyệt), thông tin user |
| `components/` | Layout (sidebar, header) và `ProtectedRoute` kiểm tra quyền theo role |
| `pages/` | Mỗi trang một thư mục: Dashboard, Products, Categories, Suppliers, Imports, Exports, Inventory, Barcode, Data, Users, Profile, AiChat, Auth |
| `utils/excelExport.js` | Xuất Excel có định dạng, xuất hóa đơn (Excel và In/Lưu PDF), đọc số thành chữ tiếng Việt |

## Xuất Excel và hóa đơn

Mọi chỗ xuất file dùng chung `utils/excelExport.js`:

- `createWorkbook()`, `addTableSheet(wb, opts)`, `downloadWorkbook(wb, name)`: dựng bảng có tiêu đề, màu, viền, định dạng số/ngày, dòng tổng và chỗ ký tên. Tùy chọn `plain: true` giữ header ở dòng 1 (dùng cho file cần nhập lại).
- `exportInvoiceExcel(kind, doc)` và `printInvoice(kind, doc)`: hóa đơn một phiếu, `kind` là `'import'` hoặc `'export'`. `printInvoice` mở hộp thoại in qua iframe ẩn (chọn "Lưu thành PDF" để có file PDF).
- Thư viện `exceljs` chỉ được tải khi người dùng bấm xuất, nên không làm nặng lần tải đầu.

## Lưu ý

- `npm run lint` hiện lỗi do cấu hình ESLint cũ (`eslint.config.js`); kiểm tra nhanh bằng `npm run build`.
- Khóa giải mã thông tin user ở client (`SECRET_CRYPTO` trong `context/AuthContext.jsx`) phải khớp `SECRET_CRYPTO` ở server.
