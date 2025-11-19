# 🔢 Hệ thống mã hóa đơn (Bill Code System)

## Tổng quan

Thay vì sử dụng MongoDB ObjectID dài và khó nhớ (`673a1234567890abcdef1234`), mỗi hóa đơn giờ có **mã tự động tăng dần** rất dễ sử dụng: `bill1`, `bill2`, `bill3`...

## Ưu điểm

### ✅ Dễ sử dụng
- **Trước:** `/editbill 673a1234567890abcdef1234 amount 500000`
- **Bây giờ:** `/editbill bill1 amount 500000`

### ✅ Dễ nhớ
- Mã ngắn gọn: `bill1`, `bill2`, `bill3`...
- Không cần copy/paste
- Có thể gõ trực tiếp

### ✅ Tự động tăng
- Không cần lo nghĩ về mã
- Hệ thống tự động tạo mã tiếp theo
- Không bị trùng lặp

### ✅ An toàn
- Vẫn giữ MongoDB `_id` cho database
- Mã `code` là unique index
- Tìm kiếm nhanh

## Cách hoạt động

### 1. Khi tạo hóa đơn mới

```javascript
// User gọi lệnh
/addbill dien 500000 Tiền điện

// Hệ thống tự động:
// 1. Tìm bill có số cao nhất (ví dụ: bill5)
// 2. Tạo mã mới: bill6
// 3. Lưu hóa đơn với code: "bill6"

// Kết quả
✅ Đã thêm hóa đơn thành công!
• Mã: bill6
• Loại: ⚡ Điện
• Số tiền: 500,000 VNĐ
```

### 2. Khi xem danh sách

```javascript
/listbills

// Hiển thị
1. Điện - 500,000 VNĐ ✅
   Mã: bill1
   Ngày: 18/11/2025
   
2. Nước - 200,000 VNĐ ❌
   Mã: bill2
   Ngày: 17/11/2025
```

### 3. Khi chỉnh sửa/xóa/thanh toán

```javascript
// Chỉ cần dùng mã
/editbill bill1 amount 600000
/paidbill bill2
/deletebill bill3
```

## Cấu trúc Database

### Bill Schema

```javascript
{
  code: {
    type: String,
    required: true,
    unique: true,      // Đảm bảo không trùng
    index: true        // Tìm kiếm nhanh
  },
  userId: Number,
  category: Object,
  amount: Number,
  // ... các trường khác
}
```

### Auto-increment Logic

```javascript
// Static method trong Bill model
getNextCode: async function () {
  // 1. Tìm tất cả bills có code dạng "bill\d+"
  const bills = await this.find({ code: /^bill\d+$/ });
  
  // 2. Trích xuất số từ mỗi code
  const numbers = bills.map(bill => {
    const match = bill.code.match(/^bill(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  });
  
  // 3. Tìm số lớn nhất và cộng 1
  const maxNumber = Math.max(...numbers);
  return `bill${maxNumber + 1}`;
}
```

### Pre-save Hook

```javascript
// Tự động tạo code trước khi lưu
billSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    this.code = await this.constructor.getNextCode();
  }
  next();
});
```

## Các lệnh đã cập nhật

### ✅ Đã thay đổi từ ID sang Code

1. **`/addbill`** - Hiển thị mã khi tạo xong
2. **`/listbills`** - Hiển thị mã thay vì ID
3. **`/editbill <mã>`** - Tìm theo mã
4. **`/deletebill <mã>`** - Xóa theo mã
5. **`/paidbill <mã>`** - Đánh dấu theo mã
6. **`/unpaidbill <mã>`** - Đánh dấu theo mã

### Ví dụ cập nhật

#### Trước đây:
```javascript
const bill = await Bill.findOne({
  _id: billId,  // ObjectID dài
  userId: ctx.from.id
});
```

#### Bây giờ:
```javascript
const bill = await Bill.findOne({
  code: billCode,  // bill1, bill2...
  userId: ctx.from.id
});
```

## Migration & Backward Compatibility

### Dữ liệu cũ không có code

Nếu database có bills cũ không có `code`:

1. **Option 1:** Chạy migration script
```javascript
// migration.js
const bills = await Bill.find({ code: { $exists: false } });
for (let i = 0; i < bills.length; i++) {
  bills[i].code = `bill${i + 1}`;
  await bills[i].save();
}
```

2. **Option 2:** Code tự động tạo khi save
- Hook `pre('save')` sẽ tự động tạo code nếu chưa có
- Không cần migration

### Tìm kiếm theo cả code và _id

Nếu muốn hỗ trợ cả 2 (cho transition period):

```javascript
let bill;

// Thử tìm theo code trước
bill = await Bill.findOne({ code: input, userId: ctx.from.id });

// Nếu không có, thử tìm theo _id
if (!bill && mongoose.Types.ObjectId.isValid(input)) {
  bill = await Bill.findOne({ _id: input, userId: ctx.from.id });
}
```

## Performance

### Index Strategy

```javascript
// Các index đã được tạo
billSchema.index({ code: 1 });              // Unique, fast lookup
billSchema.index({ userId: 1, code: 1 });   // User-specific queries
billSchema.index({ userId: 1, month: 1, year: 1 }); // List queries
```

### Query Performance

- **Tìm theo code:** O(1) với unique index
- **Tìm max number:** O(n) nhưng chỉ khi tạo bill mới
- **List bills:** O(log n) với compound index

### Optimization Tips

1. **Cache max number** (optional):
   - Store trong Redis hoặc memory
   - Update khi tạo bill mới
   - Giảm query time

2. **Counter collection** (alternative):
   ```javascript
   // Separate counter document
   {
     _id: "bill_counter",
     seq: 123
   }
   ```

## Testing

### Test Cases

```javascript
// Test 1: First bill
const bill1 = await Bill.create({ userId: 123, amount: 100 });
expect(bill1.code).toBe("bill1");

// Test 2: Sequential bills
const bill2 = await Bill.create({ userId: 123, amount: 200 });
expect(bill2.code).toBe("bill2");

// Test 3: After deletion
await Bill.deleteOne({ code: "bill2" });
const bill3 = await Bill.create({ userId: 123, amount: 300 });
expect(bill3.code).toBe("bill3"); // Not bill2!

// Test 4: Concurrent creation
const promises = Array(10).fill().map((_, i) => 
  Bill.create({ userId: 123, amount: i * 100 })
);
const bills = await Promise.all(promises);
const codes = bills.map(b => b.code).sort();
expect(codes).toHaveLength(10);
expect(new Set(codes).size).toBe(10); // All unique
```

## Lưu ý quan trọng

### ⚠️ Không tái sử dụng code

Khi xóa `bill5`, code tiếp theo vẫn là `bill6`, không quay lại `bill5`.

**Lý do:**
- Tránh nhầm lẫn
- Audit trail tốt hơn
- Không phức tạp hóa logic

### ⚠️ Race Condition

Khi nhiều users tạo bills cùng lúc, có thể xảy ra race condition.

**Giải pháp:**
```javascript
// Option 1: Retry on duplicate key error
try {
  await bill.save();
} catch (err) {
  if (err.code === 11000) { // Duplicate key
    bill.code = await Bill.getNextCode();
    await bill.save();
  }
}

// Option 2: Use atomic counter
// Implement với findOneAndUpdate
```

### ⚠️ Scale considerations

Với hàng triệu bills:
- `getNextCode()` sẽ chậm (query all codes)
- Nên chuyển sang counter-based system
- Hoặc partition by user/month

## Roadmap

### Phase 1: ✅ Completed
- [x] Add code field to schema
- [x] Implement auto-increment
- [x] Update all commands
- [x] Update documentation

### Phase 2: Future enhancements
- [ ] Add user-specific prefixes (`user123_bill1`)
- [ ] Add date-based prefixes (`202511_bill1`)
- [ ] Implement counter collection for scale
- [ ] Add code format customization
- [ ] Support code aliases (short codes)

## Kết luận

Hệ thống mã hóa đơn mới giúp:
- ✅ Dễ sử dụng hơn nhiều
- ✅ Tăng trải nghiệm người dùng
- ✅ Giảm lỗi khi nhập
- ✅ Vẫn đảm bảo tính năng kỹ thuật

Người dùng giờ chỉ cần nhớ `bill1`, `bill2`... thay vì dãy ký tự dài 24 ký tự! 🎉

