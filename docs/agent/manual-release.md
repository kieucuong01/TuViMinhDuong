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
4. Nếu working tree có thay đổi: stage toàn bộ thay đổi hiện tại và commit bằng message đã truyền.
5. Push `master` lên `origin/master`.
6. SSH vào VPS, cập nhật checkout nguồn tại `/opt/lasotinhhoa/source` bằng `git fetch` và `git reset --hard` đúng commit vừa push.
7. Tạo release sạch từ checkout nguồn, copy `.env*`, chạy `npm ci`, seed và build.
8. Chuyển `/opt/lasotinhhoa/current`, khởi động lại PM2 `lasotinhhoa`.
9. Tự rollback nếu app mới không vượt qua health check nội bộ.
10. Smoke các URL production quan trọng.

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
- Nếu working tree đã sạch, lệnh không tạo commit mới; nó vẫn push `origin/master` và deploy `HEAD` hiện tại.
- Deploy production chuẩn là VPS pull/fetch từ GitHub sau khi push. Không deploy trực tiếp từ archive local trừ khi cần phương án khẩn cấp riêng.
- Không dùng `-Migrate` nếu không có migration Prisma cần áp dụng.
- Nếu lint, test, build, push hoặc deploy lỗi, quy trình dừng ngay.
