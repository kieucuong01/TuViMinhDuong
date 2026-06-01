# Google Ads Runbook

Muc tieu: chay quang cao dua nguoi dung vao form lap la so, do duoc cac moc chuyen doi that, roi moi tang ngan sach.

## Landing Page

- Chien dich Search nen tro ve: `/lap-la-so`
- URL day du sau khi domain on dinh: `https://lasotinhhoa.vn/lap-la-so`
- Trang nay `noindex,follow` de tranh gan trung lap SEO voi trang chu, nhung van dung binh thuong cho Google Ads.

## Conversion Actions

Tao cac conversion trong Google Ads, roi dien label vao Vercel env:

| Event | Env label | Vai tro |
| --- | --- | --- |
| `create_chart` | `NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL` | User tao la so thanh cong |
| `begin_checkout` | `NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL` | User bat dau checkout nap xu/luan giai |
| `purchase` | `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | User quay ve tu PayOS voi status thanh cong |
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

## Current Tracking

- Form lap la so gui `create_chart_submit` luc submit.
- Sau khi tao la so, server redirect ve `/la-so/<id>?created=1&adSource=...`; client ban conversion `create_chart` mot lan theo chart id.
- Form nap xu va luan giai nhanh gui `begin_checkout`.
- PayOS return URL tu nap xu co them `adPackage` va `adValue`; neu ve voi `status=success` hoac demo `status=demo-paid`, client ban conversion `purchase` mot lan theo `orderCode`.
- Khi user mo full reading va job bat dau, URL co `generating=1&reading=...`; client ban `paid_reading_request`.

## Campaign Setup

- Bat dau voi Search exact/phrase: `lap la so tu vi`, `xem la so tu vi`, `luan giai la so tu vi`, `xem ngay tot`.
- Them negative keywords: `game`, `tai app`, `lo de`, `soi cau`, `trung so`, `bua yeu`, `pdf mien phi`.
- Khong dung copy cam ket ket qua nhu "doi van chac chan" hay "biet truoc tuong lai 100%".
- Chay ngan sach nho 7-14 ngay dau, toi uu theo conversion truoc khi mo Performance Max.

## Smoke Test After Deploy

1. Mo `https://lasotinhhoa.vn/lap-la-so?utm_source=google&utm_medium=cpc&utm_campaign=smoke`.
2. Tao mot la so test va xac nhan URL co `created=1`.
3. Trong DevTools hoac Google Tag Assistant, xac nhan event `create_chart` va conversion tuong ung duoc gui.
4. Test checkout PayOS sandbox/production an toan; sau khi quay ve, xac nhan URL co `status=success`, `orderCode`, `adPackage`, `adValue`.
5. Kiem tra Google Ads conversion status sau vai gio den 24 gio dau.
