# 📅 Hướng dẫn nhập ngày cho hóa đơn

## Tổng quan

Bot giờ hỗ trợ **nhập ngày tùy chỉnh** khi thêm hoặc sửa hóa đơn. Điều này giúp bạn:
- ✅ Thêm hóa đơn cho ngày trong quá khứ
- ✅ Lên kế hoạch cho hóa đơn tương lai
- ✅ Điều chỉnh ngày nếu nhập sai

## Format ngày

**Format chuẩn:** `DD/MM/YYYY`

### Ví dụ hợp lệ:
```
15/11/2025  ✅
01/01/2025  ✅
31/12/2024  ✅
1/1/2025    ✅ (có thể không có số 0 đầu)
```

### Ví dụ không hợp lệ:
```
2025/11/15  ❌ (sai thứ tự)
15-11-2025  ❌ (dùng dấu gạch ngang)
15.11.2025  ❌ (dùng dấu chấm)
32/11/2025  ❌ (ngày không tồn tại)
15/13/2025  ❌ (tháng không hợp lệ)
15/11/25    ❌ (năm phải 4 chữ số)
```

## Thêm hóa đơn với ngày

### Cú pháp
```
/addbill <loại> <số tiền> [DD/MM/YYYY] <mô tả>
```

### Cách 1: Không nhập ngày (dùng ngày hiện tại)
```
/addbill dien 500000 Tiền điện tháng 11
```

Bot sẽ tự động dùng ngày hôm nay.

### Cách 2: Nhập ngày cụ thể
```
/addbill dien 500000 15/11/2025 Tiền điện tháng 11
```

Bot sẽ dùng ngày 15/11/2025.

### Ví dụ thực tế

#### Thêm hóa đơn quá khứ
```
# Bạn quên thêm hóa đơn điện ngày 1/11
/addbill dien 450000 01/11/2025 Tiền điện đầu tháng

# Kết quả
✅ Đã thêm hóa đơn thành công!
• Mã: bill5
• Loại: ⚡ Điện
• Số tiền: 450,000 VNĐ
• Mô tả: Tiền điện đầu tháng
• Ngày: 01/11/2025
```

#### Thêm hóa đơn tương lai
```
# Lên kế hoạch thanh toán tiền nhà tháng 12
/addbill nhao 5000000 01/12/2025 Tiền nhà tháng 12

# Kết quả
✅ Đã thêm hóa đơn thành công!
• Mã: bill6
• Loại: 🏠 Nhà ở
• Số tiền: 5,000,000 VNĐ
• Mô tả: Tiền nhà tháng 12
• Ngày: 01/12/2025
```

#### Không nhập ngày
```
# Mua đồ hôm nay, không cần nhập ngày
/addbill anuong 150000 Đi chợ mua rau

# Kết quả - dùng ngày hiện tại
✅ Đã thêm hóa đơn thành công!
• Mã: bill7
• Loại: 🍔 Ăn uống
• Số tiền: 150,000 VNĐ
• Mô tả: Đi chợ mua rau
• Ngày: 20/11/2025 (ngày hiện tại)
```

## Sửa ngày hóa đơn

### Cú pháp
```
/editbill <mã> date <DD/MM/YYYY>
```

### Ví dụ

#### Xem hóa đơn hiện tại
```
/listbills

# Kết quả
1. Điện - 500,000 VNĐ ❌
   Mã: bill1
   Ngày: 20/11/2025  ← Sai ngày!
```

#### Sửa ngày
```
/editbill bill1 date 15/11/2025

# Kết quả
✅ Đã cập nhật hóa đơn thành công!

📝 Thông tin đã thay đổi:
• Trường: Ngày
• Giá trị cũ: 20/11/2025
• Giá trị mới: 15/11/2025

📋 Thông tin hóa đơn hiện tại:
• Loại: Điện
• Số tiền: 500,000 VNĐ
• Mô tả: Tiền điện tháng 11
• Ngày: 15/11/2025
• Trạng thái: Chưa thanh toán ❌
```

## Logic hoạt động

### 1. Khi thêm hóa đơn

```javascript
// Bot kiểm tra args[2]
/addbill dien 500000 15/11/2025 Tiền điện
         ↓     ↓       ↓         ↓
       args[0] args[1] args[2]  args[3]...

// Nếu args[2] match format DD/MM/YYYY
if (parseDate(args[2])) {
  billDate = args[2];
  description = args[3]... // Bắt đầu từ args[3]
} else {
  billDate = today;
  description = args[2]... // Bắt đầu từ args[2]
}
```

### 2. Tự động cập nhật tháng/năm

Khi bạn đổi ngày, bot tự động cập nhật:
- `date` - Ngày đầy đủ
- `month` - Tháng (1-12)
- `year` - Năm

Ví dụ:
```
/editbill bill1 date 15/12/2025

# Bot tự động set:
date = 15/12/2025
month = 12
year = 2025
```

Điều này quan trọng cho `/listbills` theo tháng:
```
/listbills 12 2025  # Sẽ hiện bill1 với ngày 15/12/2025
```

### 3. Validation

Bot kiểm tra:
- ✅ Format đúng DD/MM/YYYY
- ✅ Ngày hợp lệ (1-31)
- ✅ Tháng hợp lệ (1-12)
- ✅ Năm trong khoảng 2000-2100
- ✅ Ngày tồn tại (không có 31/02, 30/02...)

```javascript
// Bot tự động reject ngày không hợp lệ
/addbill dien 500000 31/02/2025 Test

# Kết quả
❌ Bot bỏ qua "31/02/2025" vì không hợp lệ
✅ Sử dụng ngày hiện tại
✅ "31/02/2025 Test" được coi là mô tả
```

## Use Cases

### 1. Nhập hóa đơn định kỳ tháng trước

```bash
# Cuối tháng, nhập tất cả bills tháng 11
/addbill dien 500000 01/11/2025 Điện tháng 11
/addbill nuoc 200000 01/11/2025 Nước tháng 11
/addbill mang 300000 05/11/2025 Internet
/addbill nhao 5000000 01/11/2025 Tiền nhà
```

### 2. Lên kế hoạch chi tiêu

```bash
# Đầu tháng 11, lên kế hoạch cho tháng 12
/addbill dien 500000 01/12/2025 Dự kiến tiền điện
/addbill nuoc 200000 01/12/2025 Dự kiến tiền nước
/addbill nhao 5000000 01/12/2025 Tiền nhà tháng 12
```

### 3. Sửa lỗi nhập sai ngày

```bash
# Nhập nhầm ngày
/addbill dien 500000 Tiền điện
# → Dùng ngày 20/11/2025 (hôm nay)

# Nhưng thực tế bill ngày 15/11
/editbill bill1 date 15/11/2025
# → Đã sửa thành 15/11/2025
```

### 4. Tracking chi tiêu hàng ngày

```bash
# Sáng 15/11
/addbill anuong 50000 15/11/2025 Ăn sáng

# Trưa 15/11
/addbill anuong 80000 15/11/2025 Ăn trưa

# Tối 15/11
/addbill anuong 100000 15/11/2025 Ăn tối

# Xem tổng chi tiêu 15/11
/listbills 11 2025
# → Hiện tất cả bills tháng 11, filter theo ngày nếu cần
```

## Lỗi thường gặp

### ❌ Lỗi 1: Nhầm lẫn format
```
# Sai
/addbill dien 500000 2025/11/15 Tiền điện
→ Bot coi "2025/11/15" là mô tả, dùng ngày hiện tại

# Đúng
/addbill dien 500000 15/11/2025 Tiền điện
```

### ❌ Lỗi 2: Ngày không tồn tại
```
# Sai
/editbill bill1 date 31/02/2025
→ ❌ Ngày không hợp lệ!

# Đúng
/editbill bill1 date 28/02/2025
```

### ❌ Lỗi 3: Quên dấu /
```
# Sai
/editbill bill1 date 15-11-2025
→ ❌ Ngày không hợp lệ!

# Đúng
/editbill bill1 date 15/11/2025
```

### ❌ Lỗi 4: Năm 2 chữ số
```
# Sai
/editbill bill1 date 15/11/25
→ ❌ Ngày không hợp lệ!

# Đúng
/editbill bill1 date 15/11/2025
```

## Tips & Tricks

### 💡 Tip 1: Ngày có thể không cần số 0 đầu
```
# Cả 2 đều OK
/addbill dien 500000 01/11/2025 Tiền điện
/addbill dien 500000 1/11/2025 Tiền điện
```

### 💡 Tip 2: Thêm nhiều bills cùng ngày
```bash
# Sử dụng Telegram "Reply" để gửi nhanh
/addbill dien 500000 01/11/2025 Điện
/addbill nuoc 200000 01/11/2025 Nước
/addbill mang 300000 01/11/2025 Mạng
```

### 💡 Tip 3: Xem bills theo tháng
```bash
# Thêm bills tháng 11
/addbill dien 500000 15/11/2025 Điện

# Xem tất cả bills tháng 11
/listbills 11 2025

# Xem bills tháng hiện tại
/listbills
```

### 💡 Tip 4: Dùng cho budget tracking
```bash
# Đầu tháng, nhập tất cả bills dự kiến
/addbill dien 500000 01/12/2025 Dự kiến
/addbill nuoc 200000 01/12/2025 Dự kiến

# Khi có bill thực tế, update amount
/editbill bill1 amount 450000  # Tiết kiệm được 50k!
```

## Câu hỏi thường gặp

### Q: Có giới hạn ngày nào không?
**A:** Có, năm phải từ 2000-2100. Đủ cho mọi use case thực tế.

### Q: Có thể nhập giờ không?
**A:** Chưa hỗ trợ. Bot chỉ lưu ngày, không lưu giờ.

### Q: Nếu nhập ngày sai format thì sao?
**A:** Bot sẽ coi đó là phần của mô tả và dùng ngày hiện tại.

### Q: Có thể sửa ngày nhiều lần không?
**A:** Có, không giới hạn.

### Q: Ngày có ảnh hưởng đến thống kê không?
**A:** Có! `/stats` tính theo tháng dựa trên field `month` và `year`, được tự động update khi bạn đổi ngày.

### Q: Có cách nào nhập nhanh hơn không?
**A:** Nếu thêm bill cho hôm nay, bỏ qua ngày:
```
/addbill dien 500000 Tiền điện
```

## Tóm tắt

| Lệnh | Cú pháp | Ví dụ |
|------|---------|-------|
| Thêm bill (ngày hiện tại) | `/addbill <loại> <số tiền> <mô tả>` | `/addbill dien 500000 Tiền điện` |
| Thêm bill (ngày tùy chỉnh) | `/addbill <loại> <số tiền> <DD/MM/YYYY> <mô tả>` | `/addbill dien 500000 15/11/2025 Tiền điện` |
| Sửa ngày | `/editbill <mã> date <DD/MM/YYYY>` | `/editbill bill1 date 15/11/2025` |

**Format ngày:** `DD/MM/YYYY` (01/11/2025, 15/12/2024...)

Chúc bạn quản lý chi tiêu hiệu quả! 💰

