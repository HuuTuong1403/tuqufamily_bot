# 📝 Hướng dẫn sử dụng /editbill

## Cú pháp
```
/editbill <mã> <trường> <giá trị mới>
```

**Lưu ý:** Mỗi hóa đơn có mã tự động tăng dần: `bill1`, `bill2`, `bill3`... dễ sử dụng hơn nhiều so với MongoDB ID!

## Các trường có thể chỉnh sửa

### 1. **category** - Thay đổi loại hóa đơn
```
/editbill bill1 category dien
/editbill bill2 category nuoc
/editbill bill3 category anuong
```

**Lưu ý:** Loại hóa đơn phải đã tồn tại trong danh sách của bạn. Dùng `/categories` để xem danh sách.

### 2. **amount** - Thay đổi số tiền
```
/editbill bill1 amount 500000
/editbill bill2 amount 1250000
```

**Lưu ý:** Số tiền phải là số dương (> 0).

### 3. **description** - Thay đổi mô tả
```
/editbill bill1 description Tiền điện tháng 11 đã cập nhật
/editbill bill2 description Đi chợ mua đồ ăn
```

**Lưu ý:** Mô tả có thể chứa nhiều từ, bot sẽ tự động ghép lại.

## Quy trình sử dụng

### Bước 1: Xem danh sách hóa đơn
```
/listbills
```

Bot sẽ hiển thị danh sách hóa đơn kèm theo mã của mỗi hóa đơn.

### Bước 2: Copy mã hóa đơn cần sửa
Mã có dạng: `bill1`, `bill2`, `bill3`... (rất dễ nhớ và gõ!)

### Bước 3: Chỉnh sửa hóa đơn
Chọn trường cần sửa và nhập giá trị mới:

```
/editbill bill1 amount 600000
```

### Bước 4: Kiểm tra kết quả
Bot sẽ hiển thị:
- ✅ Thông báo thành công
- Giá trị cũ vs giá trị mới
- Toàn bộ thông tin hóa đơn sau khi cập nhật

## Ví dụ thực tế

### Ví dụ 1: Sửa số tiền
```
User: /listbills
Bot: 
1. Điện - 500,000 VNĐ ❌
   Mã: bill1

User: /editbill bill1 amount 600000
Bot: ✅ Đã cập nhật hóa đơn thành công!
     • Giá trị cũ: 500,000 VNĐ
     • Giá trị mới: 600,000 VNĐ
```

### Ví dụ 2: Sửa loại hóa đơn
```
User: /editbill bill1 category nuoc
Bot: ✅ Đã cập nhật hóa đơn thành công!
     • Giá trị cũ: Điện
     • Giá trị mới: Nước
```

### Ví dụ 3: Sửa mô tả
```
User: /editbill bill1 description Tiền điện tháng 12 đã giảm
Bot: ✅ Đã cập nhật hóa đơn thành công!
     • Giá trị cũ: Tiền điện tháng 11
     • Giá trị mới: Tiền điện tháng 12 đã giảm
```

## Lỗi thường gặp

### ❌ Thiếu tham số
```
/editbill bill1
```
→ Cần thêm trường và giá trị mới

### ❌ Trường không hợp lệ
```
/editbill bill1 date 2025-11-18
```
→ Chỉ có thể sửa: category, amount, description

### ❌ Không tìm thấy hóa đơn
```
/editbill bill999 amount 500000
```
→ Kiểm tra lại mã hoặc bạn không có quyền sửa hóa đơn này

### ❌ Số tiền không hợp lệ
```
/editbill bill1 amount -500
/editbill bill1 amount abc
```
→ Số tiền phải là số dương

### ❌ Loại hóa đơn không tồn tại
```
/editbill bill1 category khongcogiatri
```
→ Dùng `/categories` để xem danh sách loại hợp lệ
→ Hoặc `/addcategory` để thêm loại mới

## Lệnh liên quan

- `/listbills` - Xem danh sách hóa đơn và mã
- `/categories` - Xem danh sách loại hóa đơn
- `/paidbill <mã>` - Đánh dấu đã thanh toán
- `/deletebill <mã>` - Xóa hóa đơn
- `/help` - Xem tất cả lệnh

## Lưu ý quan trọng

1. ⚠️ **Chỉ sửa được hóa đơn của mình** - Không thể sửa hóa đơn của người khác
2. 📅 **Không sửa được ngày tạo** - Ngày tạo hóa đơn được giữ nguyên
3. ✅ **Trạng thái thanh toán không đổi** - Dùng `/paidbill` hoặc `/unpaidbill` để thay đổi
4. 🔄 **Có thể sửa nhiều lần** - Không giới hạn số lần chỉnh sửa
5. 💾 **Thay đổi lưu ngay lập tức** - Không thể hoàn tác
6. 🔢 **Mã tự động tăng** - Mỗi hóa đơn mới tự động có mã bill1, bill2, bill3...

## Tips

- Mã `bill1`, `bill2`... rất dễ nhớ và gõ, không cần copy/paste!
- Kiểm tra kỹ giá trị mới trước khi gửi lệnh
- Dùng `/listbills` để xem lại sau khi sửa
- Nếu cần sửa nhiều trường, gọi lệnh nhiều lần:
  ```
  /editbill bill1 amount 600000
  /editbill bill1 description Đã cập nhật số mới
  ```

