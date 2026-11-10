# Server - Hệ thống quản lý kho Hải Hương

API viết bằng **Node.js + Express**, lưu dữ liệu trong **MongoDB** qua Mongoose. Cổng mặc định: `3000`.

## Chạy

```bash
npm install
npm run dev      # nodemon src/server.js
```

Cần tạo file `.env` trong thư mục này (không commit). Tên biến và ý nghĩa nằm ở [README gốc](../README.md#-biến-môi-trường). Ba biến bắt buộc: `CONNECT_DB` (chuỗi kết nối MongoDB), `URL_CLIENT` (origin client cho CORS), `SECRET_CRYPTO`.

## Cấu trúc `src/`

| Thư mục | Nội dung |
|---|---|
| `routes/` | Khai báo endpoint và quyền (`authUser`, `authorize('admin', 'manager')`) |
| `controller/` | Nhận request, gọi service, trả response |
| `services/` | Logic nghiệp vụ (đăng ký/duyệt user, phiếu nhập/xuất, tồn kho, nhà cung cấp...) |
| `models/` | Schema Mongoose, trong đó `image.model.js` lưu ảnh dạng Buffer |
| `auth/checkAuth.js` | Middleware đăng nhập và phân quyền; chặn tài khoản bị khóa hoặc chưa được duyệt |
| `core/` | Lớp lỗi (`PendingApprovalError` trả 403 kèm `code: 'ACCOUNT_PENDING'`) và response chuẩn |
| `seed/seed.js` | Nạp dữ liệu mẫu từ `../Database/*.json` |

## Quy trình đáng chú ý

- **Đăng ký và duyệt:** `POST /api/users/register` tạo tài khoản `isApproved: false` và không cấp cookie. Đăng nhập trả 403 `ACCOUNT_PENDING` cho đến khi admin gọi `PATCH /api/users/admin/users/:id/approve`. Tài khoản cũ không có trường `isApproved` được coi là đã duyệt.
- **Ảnh:** `/api/upload/single` và `/multiple` lưu ảnh vào collection `images` và trả URL `…/api/upload/image/:id`. Đặt `IMAGE_STORAGE=cloudinary` để dùng Cloudinary như trước.
- **Đơn của nhà cung cấp:** `GET /api/suppliers/:id/orders` trả các phiếu nhập kèm thống kê (tổng và số lượng chỉ tính phiếu đã hoàn thành).

## Seed dữ liệu

```bash
node src/seed/seed.js
```

**Cảnh báo:** lệnh này xóa sạch các collection rồi nạp lại từ `../Database/`. Chỉ chạy trên DB dùng thử. File `ql-kho.apikeys.json` không nằm trong git.
