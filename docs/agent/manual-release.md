# Commit, push và deploy production bằng một lệnh

Chạy tại thư mục gốc của repo:

```powershell
git status --short
npm run release:production -- "feat: mô tả thay đổi"
```

Lệnh thứ hai tự thực hiện:

1. Kiểm tra đang ở branch `master`.
2. Chặn `.env`, `.next`, log, `node_modules` và Prisma client sinh tự động.
3. Chạy `npm run lint`, `npm test`, `npm run build`.
4. Stage toàn bộ thay đổi hiện tại, commit và push `origin/master`.
5. Tạo release mới trên VPS, copy `.env*`, chạy `npm ci` và build.
6. Chuyển `/opt/lasotinhhoa/current`, khởi động lại PM2 `lasotinhhoa`.
7. Tự rollback nếu app mới không vượt qua health check nội bộ.
8. Smoke các URL production quan trọng.

Nếu release có migration Prisma đã được review và commit:

```powershell
npm run release:production -- "feat: cập nhật schema" -Migrate
```

Xem trước các bước mà không commit, push hoặc deploy:

```powershell
npm run release:production -- "test: dry run" -DryRun
```

Lưu ý:

- Lệnh sẽ commit tất cả thay đổi đang hiển thị bởi `git status --short`. Hãy kiểm tra danh sách đó trước.
- Không dùng `-Migrate` nếu không có migration Prisma cần áp dụng.
- Nếu lint, test, build, push hoặc deploy lỗi, quy trình dừng ngay.
