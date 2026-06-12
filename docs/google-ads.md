# Google Ads Runbook

Muc tieu: chay quang cao dua nguoi dung vao form lap la so, do duoc cac moc chuyen doi that, roi moi tang ngan sach.

## Landing Page

- Chien dich Search nen tro ve: `/lap-la-so`
- URL day du sau khi domain on dinh: `https://lasotinhhoa.vn/lap-la-so`
- Trang nay `noindex,follow` de tranh gan trung lap SEO voi trang chu, nhung van dung binh thuong cho Google Ads.

## Conversion Actions

Tao cac conversion trong Google Ads, roi dien label vao production env:

| Event | Env label | Vai tro |
| --- | --- | --- |
| `create_chart` | `NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL` | User tao la so thanh cong |
| `begin_checkout` | `NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL` | User bat dau checkout nap xu/luan giai |
| `purchase` | `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | Don nap xu da duoc webhook/order status xac minh PAID |
| `paid_reading_request` | `NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL` | User yeu cau mo luan giai tra phi bang xu |

Bat buoc set:

```env
NEXT_PUBLIC_GOOGLE_ADS_ID="AW-XXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL="..."
```

`NEXT_PUBLIC_GA_ID` van duoc dung cho GA4 page view va event funnel.

Khong commit cac gia tri nay vao repo. Set trong `.env` production tren VPS, roi deploy/restart PM2 de Next.js doc lai public env luc build:

```powershell
# VPS production env
NEXT_PUBLIC_GOOGLE_ADS_ID="AW-XXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL="..."
NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL="..."
```

## Current Tracking

- Form lap la so gui `create_chart_submit` luc submit.
- Sau khi tao la so, server redirect ve `/la-so/<id>?created=1&adSource=...`; client ban conversion `create_chart` mot lan theo chart id.
- Form nap xu va luan giai nhanh gui `begin_checkout`.
- PayOS return URL tu nap xu co `status=success` va `orderCode`, nhung client chi ban conversion `purchase` sau khi `/api/payments/status?orderCode=...` tra ve order dung user va da `PAID`.
- Che do demo `status=demo-paid` van duoc phep ban conversion trong moi truong demo de smoke flow khong can webhook that.
- Khi user mo full reading va job bat dau, URL co `generating=1&reading=...`; client ban `paid_reading_request`.

## Campaign Setup

- Bat dau voi Search exact/phrase: `lap la so tu vi`, `xem la so tu vi`, `luan giai la so tu vi`, `xem ngay tot`.
- Them negative keywords: `game`, `tai app`, `lo de`, `soi cau`, `trung so`, `bua yeu`, `pdf mien phi`.
- Khong dung copy cam ket ket qua nhu "doi van chac chan" hay "biet truoc tuong lai 100%".
- Chay ngan sach nho 7-14 ngay dau, toi uu theo conversion truoc khi mo Performance Max.

## Smoke Test After Deploy

Chay smoke script de bat loi cau hinh co ban:

```powershell
$env:ADS_SMOKE_URL="https://lasotinhhoa.vn/lap-la-so?utm_source=google&utm_medium=cpc&utm_campaign=smoke"
$env:ADS_EXPECTED_GOOGLE_ADS_ID="AW-XXXXXXXXXX"
$env:NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL="..."
$env:NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL="..."
$env:NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL="..."
$env:NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL="..."
npm run smoke:google-ads
```

Sau do smoke bang Google Tag Assistant:

1. Mo Tag Assistant va connect toi `https://lasotinhhoa.vn/lap-la-so?utm_source=google&utm_medium=cpc&utm_campaign=smoke`.
2. Xac nhan AW tag duoc nhan tren landing page.
3. Tao mot la so test va xac nhan URL co `created=1`; event `create_chart` chi ban mot lan theo chart id.
4. Test checkout PayOS sandbox/production an toan; sau khi quay ve voi `status=success`, xac nhan `purchase` chi ban sau khi request `/api/payments/status` tra ve `verified: true`.
5. Kiem tra Google Ads conversion status sau vai gio den 24 gio dau.
