# 📦 Hệ Thống Quản Lý Kho Hàng

Hệ thống quản lý kho hàng toàn diện được xây dựng với **ReactJS**, **Node.js**, **MongoDB**, **TailwindCSS** và **Ant Design**.

---

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt & Chạy Dự Án](#cài-đặt--chạy-dự-án)
- [Biến Môi Trường](#biến-môi-trường)
- [Tính Năng](#tính-năng)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

---

## 🎯 Tổng Quan

Hệ thống Quản lý kho hàng hỗ trợ doanh nghiệp quản lý toàn bộ quy trình nhập kho, xuất kho, tồn kho, sản phẩm, nhà cung cấp, và tạo báo cáo thống kê. Hệ thống có phân quyền rõ ràng và tích hợp AI chatbot hỗ trợ gợi ý nhập hàng.

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **React.js** | ^18.x | Thư viện xây dựng giao diện |
| **Vite** | ^5.x | Build tool nhanh cho React |
| **TailwindCSS** | ^3.x | Framework CSS utility-first |
| **Ant Design** | ^5.x | Bộ UI components chuyên nghiệp |
| **Axios** | ^1.x | HTTP client cho API calls |
| **React Router** | ^6.x | Điều hướng trang SPA |
| **Recharts** | ^2.x | Thư viện biểu đồ |
| **xlsx** | ^0.18.x | Đọc/ghi file Excel |
| **jspdf** | ^2.x | Xuất file PDF |
| **html5-qrcode** | ^2.x | Quét mã QR/Barcode |
| **React Toastify** | ^9.x | Thông báo toast |

### Backend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Node.js** | ^18.x | Runtime JavaScript |
| **Express.js** | ^4.x | Web framework |
| **MongoDB** | ^7.x | Cơ sở dữ liệu NoSQL |
| **Mongoose** | ^8.x | ODM cho MongoDB |
| **JWT** | ^9.x | Xác thực token |
| **Bcrypt** | ^5.x | Mã hóa mật khẩu |
| **Multer** | ^1.x | Upload file |
| **Cloudinary** | ^1.x | Lưu trữ hình ảnh |
| **Nodemailer** | ^6.x | Gửi email (quên mật khẩu) |
| **Groq SDK** | latest | AI chatbot |

---

## 📁 Cấu Trúc Dự Án

```
quanlykho-baocao/
├── Database/                   # Dữ liệu mẫu (mongoexport JSON) cho seed
├── client/                     # Frontend (React + Vite), xem client/README.md
│   ├── public/
│   ├── src/
│   │   ├── api/axiosClient.js  # Axios dùng chung, tự refresh token
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Layout/         # MainLayout, Sidebar, HeaderBar
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Auth/           # Login, Register (chờ duyệt), ForgotPassword
│   │   │   ├── Dashboard/  Products/  Categories/  Suppliers/
│   │   │   ├── Imports/  Exports/  Inventory/  Barcode/
│   │   │   ├── Data/           # Import / Export dữ liệu Excel
│   │   │   ├── Users/          # Quản lý và duyệt người dùng (admin)
│   │   │   └── Profile/  AiChat/
│   │   ├── utils/excelExport.js  # Excel có định dạng, hóa đơn, số thành chữ
│   │   ├── App.jsx  main.jsx  index.css
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend (Node.js + Express), xem server/README.md
│   ├── src/
│   │   ├── auth/               # checkAuth: đăng nhập và phân quyền
│   │   ├── config/             # connectDB, cloudinary
│   │   ├── controller/         # Nhận request, gọi service
│   │   ├── core/               # Lớp lỗi và response chuẩn
│   │   ├── models/             # Schema Mongoose (user, product, supplier, import, export, image...)
│   │   ├── routes/             # Khai báo endpoint và quyền
│   │   ├── seed/seed.js        # Nạp dữ liệu mẫu (xóa sạch rồi nạp lại)
│   │   ├── services/           # Logic nghiệp vụ
│   │   ├── utils/              # jwt, gửi email quên mật khẩu
│   │   └── server.js           # Entry point (cổng 3000)
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu cầu
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local hoặc MongoDB Atlas)

### Bước 1: Lấy mã nguồn

```bash
git clone <repository-url>
cd quanlykho-baocao
```

### Bước 2: Cài đặt Backend

```bash
cd server
npm install
```

### Bước 3: Cài đặt Frontend

```bash
cd ../client
npm install
```

Client chạy ở cổng **5173** (`vite.config.js`), gọi API ở `http://localhost:3000/api`.

### Bước 4: Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/` (có sẵn mẫu `server/.env.example`, chỉ cần sao chép rồi điền giá trị):
```env
# MongoDB (local hoặc Atlas), tên biến trong code là CONNECT_DB
CONNECT_DB=mongodb://localhost:27017/ql-kho
# Origin của client (CORS) và khóa ký token/mã hóa, phải khớp SECRET_CRYPTO ở client
URL_CLIENT=http://localhost:5173
SECRET_CRYPTO=your_secret

# Ảnh: mặc định lưu trong MongoDB. Đặt IMAGE_STORAGE=cloudinary để dùng Cloudinary
# IMAGE_STORAGE=mongo
# PUBLIC_SERVER_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (quên mật khẩu)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

# AI chatbot
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### Bước 5: Chạy dự án

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Truy cập client: **http://localhost:5173** (server API chạy ở cổng 3000)

---

## 🔑 Biến Môi Trường

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `CONNECT_DB` | Connection string MongoDB | ✅ |
| `URL_CLIENT` | Origin của client cho CORS | ✅ |
| `SECRET_CRYPTO` | Khóa ký token và mã hóa thông tin user | ✅ |
| `IMAGE_STORAGE` | `mongo` (mặc định, ảnh lưu trong MongoDB) hoặc `cloudinary` | ⚡ |
| `PUBLIC_SERVER_URL` | URL công khai của server, dùng để tạo link ảnh | ⚡ |
| `CLOUDINARY_*` | Chỉ cần khi `IMAGE_STORAGE=cloudinary` | ⚡ |
| `SMTP_*`, `FROM_EMAIL` | Gửi email quên mật khẩu | ⚡ |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | AI chatbot | ⚡ |

> ✅ = Bắt buộc | ⚡ = Cần cho tính năng cụ thể

### Ghi chú vận hành

- **Ảnh:** ảnh upload mới lưu trong collection `images` của MongoDB và được phục vụ qua `/api/upload/image/:id`. Ảnh sản phẩm cũ trỏ tới Cloudinary sẽ không hiện nếu tài khoản Cloudinary đó không còn phát ảnh.
- **Đăng ký tài khoản:** tài khoản đăng ký mới ở trạng thái chờ duyệt, chỉ đăng nhập được sau khi admin duyệt tại mục Người dùng. Tài khoản cũ (không có trường `isApproved`) coi như đã duyệt.
- **Xuất Excel và hóa đơn:** dùng chung tiện ích `client/src/utils/excelExport.js`. Hóa đơn từng phiếu có hai dạng: In / Lưu PDF và file Excel.

---

## ✨ Tính Năng

### 1. 🔐 Quản lý tài khoản
- Đăng ký / Đăng nhập / Đăng xuất
- Quên mật khẩu (gửi email reset)
- Phân quyền: **Admin**, **Quản lý (Trưởng kho)**, **Nhân viên kho**
- Quản lý hồ sơ, đổi mật khẩu
- **Duyệt tài khoản mới:** đăng ký xong ở trạng thái chờ duyệt (hiện thông báo "chờ xét duyệt"), chỉ đăng nhập được sau khi admin duyệt ở mục Người dùng. Tài khoản Google mới cũng phải chờ duyệt

### 2. 📦 Quản lý sản phẩm
- CRUD sản phẩm đầy đủ
- Thông tin: tên, SKU, hình ảnh, giá nhập/bán, tồn kho, danh mục, nhà cung cấp, mô tả
- Hỗ trợ mã QR & mã vạch (Barcode)
- Lọc theo danh mục, nhà cung cấp, tình trạng
- Form thêm sản phẩm chọn rõ **nhà cung cấp hợp tác**; bảng sản phẩm có cột Nhà cung cấp
- Ảnh sản phẩm upload lên và lưu trong MongoDB (không cần Cloudinary)

### 3. 🏷 Quản lý danh mục
- CRUD danh mục sản phẩm

### 4. 🏢 Quản lý nhà cung cấp
- CRUD nhà cung cấp (tên, SĐT, email, địa chỉ)
- Nút "mắt" mở chi tiết kèm **các đơn nhập hàng giữa hai bên**: ngày giờ nhập, số lượng, tổng tiền, trạng thái, xem từng sản phẩm của đơn; có thống kê tổng đơn, tổng số lượng, tổng giá trị, lần nhập gần nhất

### 5. 📥 Quản lý nhập kho
- Tạo phiếu nhập kho
- Chọn nhà cung cấp, sản phẩm, số lượng, giá nhập
- Xem lịch sử nhập kho
- Tự động cập nhật tồn kho
- **Xuất hóa đơn / phiếu nhập từng đơn:** In hoặc Lưu PDF, hoặc tải file Excel (có "bằng chữ" và chỗ ký tên)
- Xuất Excel theo tháng có định dạng chuẩn (tiêu đề, màu, viền, định dạng số, dòng tổng không cộng phiếu đã hủy)

### 6. 📤 Quản lý xuất kho
- Tạo phiếu xuất kho
- Kiểm tra tồn kho trước khi xuất
- Ghi chú lý do xuất
- Xem lịch sử xuất kho
- **Xuất hóa đơn từng đơn xuất:** In hoặc Lưu PDF, hoặc tải file Excel
- Xuất Excel theo tháng có định dạng chuẩn

### 7. 📊 Quản lý tồn kho
- Xem số lượng tồn theo sản phẩm
- Cảnh báo sắp hết hàng / tồn kho thấp
- Kiểm kê kho

### 8. 🛒 Quản lý đơn hàng *(optional)*
- Quản lý đơn nhập / đơn xuất
- Theo dõi trạng thái đơn

### 9. 📈 Thống kê & Báo cáo
- Thống kê nhập kho, xuất kho, tồn kho
- Top sản phẩm nhập/bán nhiều
- Biểu đồ trực quan (Recharts)

### 10. 🔍 Tìm kiếm thông minh
- Tìm theo tên, mã SKU, danh mục

### 11. 🔔 Thông báo
- Cảnh báo sắp hết hàng
- Cảnh báo hàng tồn lâu

### 12. 📂 Import / Export dữ liệu
- Import số lượng nhập thêm từ Excel (file mẫu xuất từ chính hệ thống)
- Export sản phẩm, phiếu nhập, phiếu xuất, tồn kho ra Excel có định dạng chuẩn (dùng chung `client/src/utils/excelExport.js`)

### 13. 🏠 Dashboard quản trị
- Tổng sản phẩm, tổng nhập/xuất kho
- Sản phẩm sắp hết hàng
- Biểu đồ nhập/xuất theo thời gian

### 14. 🤖 AI Chatbot
- Gợi ý nhập hàng dựa trên dữ liệu tồn kho
- Hỗ trợ trả lời câu hỏi về kho hàng

---

## 🔗 API Endpoints

Tất cả endpoint nằm dưới `/api`. "User" nghĩa là đã đăng nhập (cookie `token`).

### Users (`/api/users`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/register` | Đăng ký (tài khoản chờ duyệt, không cấp token) | Public |
| POST | `/login` | Đăng nhập (403 `ACCOUNT_PENDING` nếu chưa được duyệt) | Public |
| POST | `/login-google` | Đăng nhập Google (tài khoản mới chờ duyệt) | Public |
| GET | `/refresh-token` | Làm mới token | Public |
| POST | `/forgot-password` | Gửi OTP quên mật khẩu | Public |
| POST | `/reset-password` | Đặt lại mật khẩu | Public |
| GET | `/auth` | Thông tin tài khoản hiện tại | User |
| POST | `/logout` | Đăng xuất | User |
| PUT | `/update` | Cập nhật hồ sơ | User |
| PUT | `/change-password` | Đổi mật khẩu | User |
| GET | `/admin/users` | Danh sách người dùng (không trả hash mật khẩu) | Admin |
| PUT | `/admin/users/:id` | Sửa người dùng, đổi quyền | Admin |
| PATCH | `/admin/users/:id/approve` | Duyệt tài khoản (`{ approved: true }`) | Admin |
| DELETE | `/admin/users/:id` | Xóa người dùng | Admin |

### Products (`/api/products`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/` , `/:id` | Danh sách, chi tiết | User |
| GET | `/low-stock`, `/stats` | Sắp hết hàng, thống kê | User |
| GET | `/barcode/:code` | Tra cứu theo mã vạch | User |
| GET | `/:id/recommended` | Sản phẩm gợi ý | User |
| POST | `/` | Thêm sản phẩm (bắt buộc chọn nhà cung cấp) | Admin, Quản lý |
| PUT | `/:id` | Sửa sản phẩm | Admin, Quản lý |
| DELETE | `/:id` | Xóa sản phẩm | Admin, Quản lý |
| POST | `/:id/variants` | Thêm biến thể | Admin, Quản lý |

### Categories (`/api/categories`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/`, `/:id` | Danh sách, chi tiết | User |
| POST, PUT | `/`, `/:id` | Thêm, sửa | Admin, Quản lý |
| DELETE | `/:id` | Xóa | Admin |

### Suppliers (`/api/suppliers`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/`, `/simple`, `/:id` | Danh sách, rút gọn (cho dropdown), chi tiết | User |
| GET | `/:id/orders` | Các đơn nhập của nhà cung cấp kèm thống kê tổng hợp | User |
| POST, PUT | `/`, `/:id` | Thêm, sửa | Admin, Quản lý |
| DELETE | `/:id` | Xóa (không xóa được nếu còn sản phẩm) | Admin |

### Imports (`/api/imports`) và Exports (`/api/exports`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/`, `/:id`, `/stats` | Danh sách, chi tiết, thống kê | User |
| POST | `/` | Tạo phiếu (chờ duyệt, hoặc hoàn thành ngay) | Admin, Quản lý, Nhân viên |
| PATCH | `/:id/approve` | Duyệt phiếu, cập nhật tồn kho | Admin, Quản lý |
| PATCH | `/:id/cancel` | Hủy phiếu (hoàn lại tồn kho nếu đã duyệt) | Admin, Quản lý |

### Inventory, Dashboard, Chatbot
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/inventory/overview` | Tổng quan tồn kho | User |
| GET | `/api/inventory/stock` | Danh sách tồn kho | User |
| GET | `/api/inventory/history/:productId` | Lịch sử xuất nhập của 1 sản phẩm | User |
| GET | `/api/dashboard/stats` | Số liệu dashboard | User |
| POST | `/api/chatbot` | Chat với AI | User |
| GET | `/api/chatbot/history` | Lịch sử chat | User |

### Upload ảnh (`/api/upload`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/single` | Upload 1 ảnh (tối đa 5MB), trả `metadata.url` | User |
| POST | `/multiple` | Upload tối đa 10 ảnh | User |
| GET | `/image/:id` | Xem ảnh đã lưu trong MongoDB | Public |

---

## 🗄 Database Schema

### User
```js
{
  fullName: String,
  email: String (unique),
  password: String (bcrypt hash),
  phone: String,
  address: String,
  birthDay: Date,
  role: String (enum: ['admin', 'manager', 'staff'], default: 'staff'),
  isLocked: Boolean (default: false),
  isApproved: Boolean (default: true; đăng ký mới được tạo với false),
  approvedAt: Date,
  typeLogin: String (enum: ['email', 'google']),
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Image (ảnh lưu trong MongoDB)
```js
{
  data: Buffer,
  contentType: String,
  size: Number,
  originalName: String,
  folder: String,
  createdBy: ObjectId (ref: User)
}
```

### Product
```js
{
  name: String,
  sku: String (unique),        // Mã sản phẩm
  image: String,               // URL Cloudinary
  importPrice: Number,         // Giá nhập
  salePrice: Number,           // Giá bán
  quantity: Number,            // Số lượng tồn
  category: ObjectId (ref: Category),
  supplier: ObjectId (ref: Supplier),
  description: String,
  qrCode: String,
  barcode: String,
  minStock: Number,            // Ngưỡng cảnh báo tồn kho thấp
  createdAt: Date,
  updatedAt: Date
}
```

### Category
```js
{
  name: String (unique),
  description: String,
  createdAt: Date
}
```

### Supplier
```js
{
  name: String,
  phone: String,
  email: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### ImportReceipt (Phiếu nhập kho)
```js
{
  code: String (unique),       // Mã phiếu nhập (auto-gen)
  supplier: ObjectId (ref: Supplier),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    importPrice: Number
  }],
  totalAmount: Number,
  note: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### ExportReceipt (Phiếu xuất kho)
```js
{
  code: String (unique),       // Mã phiếu xuất (auto-gen)
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number
  }],
  reason: String,              // Lý do xuất
  note: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Notification
```js
{
  type: String (enum: ['low_stock', 'overstock']),
  message: String,
  product: ObjectId (ref: Product),
  isRead: Boolean (default: false),
  createdAt: Date
}
```

---

## 👥 Phân Quyền

| Chức năng | Admin | Quản lý (Trưởng kho) | Nhân viên kho |
|---|:---:|:---:|:---:|
| Quản lý người dùng, phân quyền, xóa thành viên | ✅ | ❌ | ❌ |
| Duyệt tài khoản đăng ký mới | ✅ | ❌ | ❌ |
| Thêm/sửa/xóa sản phẩm | ✅ | ✅ | ❌ |
| Danh mục: thêm/sửa | ✅ | ✅ | ❌ |
| Danh mục: xóa | ✅ | ❌ | ❌ |
| Nhà cung cấp: thêm/sửa | ✅ | ✅ | ❌ |
| Nhà cung cấp: xóa | ✅ | ❌ | ❌ |
| Tạo phiếu nhập/xuất (chờ duyệt) | ✅ | ✅ | ✅ |
| Duyệt / hủy phiếu nhập, xuất | ✅ | ✅ | ❌ |
| Xuất hóa đơn, xuất Excel theo tháng | ✅ | ✅ | ✅ |
| Xem tồn kho | ✅ | ✅ | ✅ |
| Quét mã vạch | ✅ | ✅ | ✅ |
| Import/Export dữ liệu Excel | ✅ | ✅ | ❌ |
| Dashboard, AI Chatbot | ✅ | ✅ | ✅ |

---

## 🎨 Giao Diện

Dự án sử dụng kết hợp **TailwindCSS** và **Ant Design**:
- **TailwindCSS**: Layout, spacing, responsive, custom styling
- **Ant Design**: Table, Form, Modal, Button, Select, DatePicker, Notification, Menu, Layout...

### Theme Configuration (Ant Design)
```js
// src/main.jsx
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

<ConfigProvider
  locale={viVN}
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  }}
>
  <App />
</ConfigProvider>
```

---

## 📝 Lưu Ý Quan Trọng

1. **MongoDB**: Đảm bảo MongoDB đang chạy trước khi start server. Có thể dùng [MongoDB Atlas](https://www.mongodb.com/atlas) (miễn phí) nếu không muốn cài local.
2. **Ảnh**: mặc định lưu trong MongoDB, không cần cấu hình gì thêm. Chỉ cần tài khoản [Cloudinary](https://cloudinary.com) khi đặt `IMAGE_STORAGE=cloudinary`.
3. **Email**: Nếu dùng Gmail, cần tạo [App Password](https://myaccount.google.com/apppasswords) thay vì dùng mật khẩu thường.
4. **AI**: chatbot dùng `GEMINI_API_KEY` và `GROQ_API_KEY` ([console.groq.com](https://console.groq.com)).
5. **Seed dữ liệu mẫu**: `cd server && node src/seed/seed.js` **xóa sạch** các collection rồi nạp lại từ thư mục `Database/`. Chỉ chạy trên DB dùng thử.

---

## 📄 License

Dự án phục vụ mục đích học tập.

---

> 🚀 **Bắt đầu**: Hãy thực hiện lần lượt từ Bước 1 → Bước 5 trong phần [Cài Đặt & Chạy Dự Án](#cài-đặt--chạy-dự-án) để khởi tạo dự án!
