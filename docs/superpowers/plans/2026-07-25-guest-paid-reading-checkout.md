# Guest Paid Reading Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép khách đọc luận giải free, nhập email và thanh toán PayOS để mở bản FULL mà không phải đăng nhập.

**Architecture:** Tái sử dụng quan hệ `User -> Chart -> PaymentOrder -> Reading` bằng một user nội bộ riêng cho mỗi checkout khách. Server claim lá số trong transaction, giữ email thật trong metadata đơn hàng, dùng magic-session token để khôi phục phiên khi PayOS trả về, rồi tiếp tục settlement FULL và kiểm tra `purchase` hiện có.

**Tech Stack:** Next.js 16 App Router, React 19 server actions, Prisma 7/PostgreSQL, PayOS, Vitest, Tailwind/CSS hiện có.

## Global Constraints

- Không thêm migration, bảng entitlement, dependency hoặc email provider.
- Không tự đăng nhập vào tài khoản đã tồn tại chỉ từ email chưa xác minh.
- Email bắt buộc với guest, không được đưa vào analytics, URL public hoặc log ứng dụng.
- Giá, xu, nội dung free, outline 9 chương và checkout của user đã đăng nhập giữ nguyên.
- Return URL không được tin `status=success`; chỉ PayOS/webhook và PaymentOrder `PAID` mới cấp quyền.
- Webhook và return phải idempotent; retry Reading đã trả tiền không tạo đơn mới.
- CTA và ô email phải dùng được trên mobile, có label và touch target phù hợp.
- Đọc `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`,
  `node_modules/next/dist/docs/01-app/02-guides/redirecting.md` và
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`
  trước khi sửa route, redirect hoặc cookie.

---

### Task 1: Tạo identity guest và claim lá số trong transaction

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/chart-ownership.test.ts`
- Test: `src/lib/auth-login-result.test.ts`

**Interfaces:**
- Produces: `normalizeCheckoutEmail(value: unknown): string | null`
- Produces: `isCheckoutGuestUser(user: Pick<SessionUser, "email"> | null | undefined): boolean`
- Produces: `consumeMagicSessionToken(token: string): Promise<SessionUser | null>`
- Produces: `claimGuestChartForCheckout(chartId: string, fullName: string): Promise<SessionUser | null>`

- [ ] **Step 1: Viết test email và identity guest**

Thêm vào `src/lib/auth-login-result.test.ts`:

```ts
import { isCheckoutGuestUser, normalizeCheckoutEmail } from "@/lib/auth";

it("normalizes checkout email without treating it as an authenticated identity", () => {
  expect(normalizeCheckoutEmail(" Reader@Example.COM ")).toBe("reader@example.com");
  expect(normalizeCheckoutEmail("not-an-email")).toBeNull();
  expect(isCheckoutGuestUser({
    email: "guest-checkout-1@checkout.lasotinhhoa.local",
  })).toBe(true);
  expect(isCheckoutGuestUser({ email: "reader@example.com" })).toBe(false);
});
```

- [ ] **Step 2: Viết test token guest chỉ dùng một lần**

Trong `src/lib/auth-login-result.test.ts`, mock transaction và kiểm tra token bị
xóa trước khi session cookie được cấp:

```ts
it("consumes a valid magic session token before restoring the user", async () => {
  const tx = {
    session: {
      findUnique: vi.fn().mockResolvedValue({
        id: "session-1",
        expiresAt: new Date(Date.now() + 60_000),
        user: existingUser,
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  getDbMock.mockReturnValue({
    $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
  });

  const user = await consumeMagicSessionToken("magic-1");

  expect(tx.session.deleteMany).toHaveBeenCalledWith({
    where: { id: "session-1", token: "magic-1" },
  });
  expect(user).toMatchObject({ id: existingUser.id });
});
```

Import `consumeMagicSessionToken` cùng các auth helper hiện có.

- [ ] **Step 3: Viết test transaction claim**

Mở rộng `src/lib/chart-ownership.test.ts` với một DB mock có `$transaction`,
`user.create` và `chart.updateMany`:

```ts
it("creates an isolated guest user and atomically claims an unowned chart", async () => {
  const tx = {
    user: {
      create: vi.fn(async ({ data }) => ({
        id: "guest-user-1",
        email: data.email,
        name: data.name,
        role: "USER",
        coinBalance: 0,
      })),
    },
    chart: { updateMany: vi.fn(async () => ({ count: 1 })) },
  };
  const db = {
    $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
  };
  mocks.getDb.mockReturnValue(db);

  const { claimGuestChartForCheckout } = await import("@/lib/data");
  const result = await claimGuestChartForCheckout("chart-1", "Nguyen Minh Anh");

  expect(result).toMatchObject({
    id: "guest-user-1",
    name: "Nguyen Minh Anh",
    role: "USER",
    coinBalance: 0,
  });
  expect(result?.email).toMatch(/^guest-checkout-.+@checkout\.lasotinhhoa\.local$/);
  expect(tx.chart.updateMany).toHaveBeenCalledWith({
    where: { id: "chart-1", userId: null },
    data: { userId: "guest-user-1" },
  });
});

it("rolls back the guest identity when another request already claimed the chart", async () => {
  const tx = {
    user: {
      create: vi.fn(async ({ data }) => ({
        id: "guest-user-2",
        email: data.email,
        name: data.name,
        role: "USER",
        coinBalance: 0,
      })),
    },
    chart: { updateMany: vi.fn(async () => ({ count: 0 })) },
  };
  const db = {
    $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
  };
  mocks.getDb.mockReturnValue(db);

  const { claimGuestChartForCheckout } = await import("@/lib/data");
  await expect(claimGuestChartForCheckout("chart-owned", "Nguoi xem")).resolves.toBeNull();
});
```

- [ ] **Step 4: Chạy test để xác nhận đang fail**

Run:

```powershell
npm test -- src/lib/auth-login-result.test.ts src/lib/chart-ownership.test.ts
```

Expected: FAIL vì bốn interface mới chưa tồn tại.

- [ ] **Step 5: Thêm helper email, guest marker và token một lần**

Trong `src/lib/auth.ts`, dùng regex email hiện có:

```ts
const CHECKOUT_GUEST_DOMAIN = "checkout.lasotinhhoa.local";

export function normalizeCheckoutEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function isCheckoutGuestUser(
  user: Pick<SessionUser, "email"> | null | undefined,
) {
  return Boolean(user?.email.endsWith(`@${CHECKOUT_GUEST_DOMAIN}`));
}
```

Trong `src/lib/auth.ts`, thêm helper dùng transaction để token chỉ được tiêu thụ
một lần:

```ts
export async function consumeMagicSessionToken(token: string) {
  const db = getDb();
  if (!db || !token) return null;

  const user = await db.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    const consumed = await tx.session.deleteMany({
      where: { id: session.id, token },
    });
    return consumed.count === 1 ? session.user : null;
  });
  if (!user) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role,
    coinBalance: user.coinBalance,
  };
  await setSession(sessionUser);
  return sessionUser;
}
```

- [ ] **Step 6: Thêm transactional claim helper**

Trong `src/lib/data.ts`, gần `claimGuestChartForUserFromPath`, dùng `randomUUID`
đã được import sẵn:

```ts
class GuestCheckoutClaimConflict extends Error {}

export async function claimGuestChartForCheckout(
  chartId: string,
  fullName: string,
): Promise<SessionUser | null> {
  const email = `guest-checkout-${randomUUID()}@checkout.lasotinhhoa.local`;
  const name = fullName.trim() || "Khach xem la so";
  const db = getDb();

  if (!db) {
    const chart = charts().get(chartId);
    if (!chart || chart.userId) return null;
    const user: SessionUser = {
      id: `guest-checkout-${randomUUID()}`,
      email,
      name,
      role: "USER",
      coinBalance: 0,
    };
    charts().set(chartId, { ...chart, userId: user.id });
    return user;
  }

  try {
    return await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, name, coinBalance: 0 },
      });
      const claimed = await tx.chart.updateMany({
        where: { id: chartId, userId: null },
        data: { userId: created.id },
      });
      if (claimed.count !== 1) throw new GuestCheckoutClaimConflict();
      return {
        id: created.id,
        email: created.email,
        name: created.name || name,
        role: created.role,
        coinBalance: created.coinBalance,
      };
    });
  } catch (error) {
    if (error instanceof GuestCheckoutClaimConflict) return null;
    throw error;
  }
}
```

- [ ] **Step 7: Chạy test**

Run:

```powershell
npm test -- src/lib/auth-login-result.test.ts src/lib/chart-ownership.test.ts
```

Expected: PASS; conflict trả `null`, lỗi DB khác vẫn throw.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/auth.ts src/lib/data.ts src/lib/auth-login-result.test.ts src/lib/chart-ownership.test.ts
git commit -m "feat: add isolated guest checkout identity"
```

### Task 2: Mở checkout PayOS cho guest trong server action

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/lib/payos.ts`
- Modify: `src/lib/payos-reading.test.ts`
- Modify: `src/app/api/webhooks/payos/route.ts`
- Create: `src/app/actions-checkout-full.test.ts`

**Interfaces:**
- Consumes: `normalizeCheckoutEmail`, `isCheckoutGuestUser`, `claimGuestChartForCheckout`
- Consumes: `createMagicSession`, `setSession`, `createPayOSCustomCheckout`
- Produces: `checkoutFullReadingAction(formData)` hỗ trợ user thường và guest

- [ ] **Step 1: Viết source-contract test cho nhánh guest**

Tạo `src/app/actions-checkout-full.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./actions.ts", import.meta.url)),
  "utf8",
);

describe("FULL checkout action guest contract", () => {
  it("requires email, claims an isolated guest, and restores it on PayOS return", () => {
    expect(source).toContain("normalizeCheckoutEmail(formData.get(\"email\"))");
    expect(source).toContain("claimGuestChartForCheckout(chartId");
    expect(source).toContain("await setSession(user)");
    expect(source).toContain("await createMagicSession(user)");
    expect(source).toContain("/api/payments/payos/full-return?token=");
    expect(source).toContain("buyerEmail");
    expect(source).toContain("checkoutEmail: buyerEmail");
  });

  it("does not route a guest through the login modal", () => {
    const checkoutSource = source.slice(
      source.indexOf("export async function checkoutFullReadingAction"),
      source.indexOf("export async function requestReadingAction"),
    );
    expect(checkoutSource).not.toContain('paywall: "login"');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run:

```powershell
npm test -- src/app/actions-checkout-full.test.ts
```

Expected: FAIL vì action vẫn redirect guest tới login.

- [ ] **Step 3: Thêm notice email không hợp lệ**

Trong `checkoutNotice` tại `src/app/la-so/[id]/page.tsx`, thêm:

```ts
if (checkout === "email-invalid") {
  return "Email chưa hợp lệ. Vui lòng mở lại bản FULL và kiểm tra email trước khi thanh toán.";
}
```

- [ ] **Step 4: Sửa đầu action để chọn owner hoặc tạo guest**

Trong `checkoutFullReadingAction`:

```ts
const [currentUser, operationSettings] = await Promise.all([
  getCurrentUser(),
  getOperationSettings(),
]);
const record = await getChart(chartId);
if (!record) redirect(withQueryParams(nextPath, { checkout: "forbidden" }));

const requiresCheckoutEmail =
  !currentUser || isCheckoutGuestUser(currentUser);
const buyerEmail = requiresCheckoutEmail
  ? normalizeCheckoutEmail(formData.get("email"))
  : currentUser.email;
if (!buyerEmail) {
  redirect(withQueryParams(nextPath, { checkout: "email-invalid" }));
}

let user = currentUser;
if (!user) {
  user = await claimGuestChartForCheckout(
    chartId,
    record.chart.input.fullName,
  );
  if (!user) redirect(withQueryParams(nextPath, { checkout: "forbidden" }));
  await setSession(user);
} else if (record.userId !== user.id && user.role !== "ADMIN") {
  redirect(withQueryParams(nextPath, { checkout: "forbidden" }));
}
```

Giữ kiểm tra operation settings trước khi tạo user/order.

- [ ] **Step 5: Tạo return token chỉ cho guest**

Trước `createPayOSCustomCheckout`:

```ts
const returnToken = requiresCheckoutEmail
  ? await createMagicSession(user)
  : null;
const returnPath = returnToken
  ? `/api/payments/payos/full-return?token=${encodeURIComponent(returnToken)}`
  : "/api/payments/payos/full-return";
```

Truyền email thật sang PayOS:

```ts
buyerName: user.name,
buyerEmail,
returnPath,
```

Lưu metadata mà parser hiện có vẫn đọc được:

```ts
directReading: {
  chartId,
  type: "FULL",
  scopeKey: "all",
  checkoutEmail: buyerEmail,
  ...(returnToken ? { token: returnToken } : {}),
},
```

- [ ] **Step 6: Bảo toàn metadata guest qua settlement**

Trước khi chạy test, mở rộng `PaidReadingOrderPayload` để giữ
`checkoutEmail?: string` và `token?: string`. Parser chỉ lấy hai field này khi
chúng là string:

```ts
const checkoutEmail =
  typeof payload.checkoutEmail === "string" ? payload.checkoutEmail : undefined;
const token = typeof payload.token === "string" ? payload.token : undefined;
return {
  kind,
  chartId: payload.chartId,
  type: "FULL",
  scopeKey: "all",
  ...(checkoutEmail ? { checkoutEmail } : {}),
  ...(token ? { token } : {}),
};
```

Trong
`completePaidReadingOrder`, tách `kind` rồi ghi lại toàn bộ metadata:

```ts
const { kind, ...metadataValue } = metadata;
// ...
rawPayload: {
  raw: rawPayload,
  [kind]: metadataValue,
}
```

Trong webhook failed branch, dùng cùng cách tách `kind` để không làm rơi email
hoặc token. Trong test idempotency, cho `freshOrder.rawPayload.directReading`
thêm `checkoutEmail: "reader@example.com"` và `token: "magic-1"`, rồi kiểm tra:

```ts
expect(tx.paymentOrder.update).toHaveBeenCalledWith({
  where: { id: "order-1" },
  data: expect.objectContaining({
    rawPayload: {
      raw: { webhook: 1 },
      directReading: {
        chartId: "chart-1",
        type: "FULL",
        scopeKey: "all",
        checkoutEmail: "reader@example.com",
        token: "magic-1",
      },
    },
  }),
});
```

- [ ] **Step 7: Chạy test tập trung**

Run:

```powershell
npm test -- src/app/actions-checkout-full.test.ts src/lib/payos-reading.test.ts src/app/api/webhooks/payos/route.test.ts
```

Expected: PASS; parser FULL vẫn chấp nhận metadata có field bổ sung.

- [ ] **Step 8: Commit**

```powershell
git add src/app/actions.ts src/app/actions-checkout-full.test.ts "src/app/la-so/[id]/page.tsx" src/lib/payos.ts src/lib/payos-reading.test.ts src/app/api/webhooks/payos/route.ts
git commit -m "feat: allow guest PayOS full checkout"
```

### Task 3: Đưa email checkout vào đúng CTA free-to-paid

**Files:**
- Modify: `src/components/premium-reading-cta.tsx`
- Modify: `src/components/premium-reading-cta.test.ts`
- Modify: `src/components/personalized-report-outline.tsx`
- Modify: `src/components/personalized-report-outline.test.ts`
- Modify: `src/components/free-overview-loader.tsx`
- Modify: `src/components/free-overview-loader.test.ts`
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `PremiumReadingCta` prop `requiresCheckoutEmail: boolean`
- Produces: `PersonalizedReportOutline` prop `canCheckoutFull: boolean`
- Consumes: `isCheckoutGuestUser(user)`

- [ ] **Step 1: Viết test modal guest**

Trong `src/components/premium-reading-cta.test.ts`, thêm prop vào các fixture và
test mới:

```ts
it("asks a guest for email and keeps PayOS as the only payment method", () => {
  const html = renderToStaticMarkup(
    createElement(PremiumReadingCta, {
      chartId: "chart-1",
      fullName: "Nguyen Minh Anh",
      hasAdvancedReading: false,
      fullPriceCoins: 199,
      coinBalance: 0,
      requiresCheckoutEmail: true,
    }),
  );

  expect(html).toContain('name="email"');
  expect(html).toContain('type="email"');
  expect(html).toContain("required");
  expect(html).toContain("Dùng để đối soát");
  expect(html).toContain('data-ad-method="payos"');
  expect(html).not.toContain('data-ad-method="coins"');
});
```

Các test owner truyền `requiresCheckoutEmail: false` và xác nhận không có input
email.

- [ ] **Step 2: Viết test CTA guest không mở login**

Trong `src/components/personalized-report-outline.test.ts`, đổi case guest:

```ts
expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
expect(html).toContain("Mở bản FULL 9 chương");
expect(html).not.toContain("/dang-nhap");
```

Truyền `canCheckoutFull: true` cho guest/owner, `false` cho signed-in non-owner.

Trong `src/components/free-overview-loader.test.ts`, case premium hook phải xác
nhận:

```ts
expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
expect(html).not.toContain("/dang-nhap");
```

Giữ CTA `Lưu lá số & đọc tiếp miễn phí` của gate 2/4 trỏ login như hiện tại.

- [ ] **Step 3: Chạy test để xác nhận fail**

Run:

```powershell
npm test -- src/components/premium-reading-cta.test.ts src/components/personalized-report-outline.test.ts src/components/free-overview-loader.test.ts
```

Expected: FAIL vì props/input/popover guest chưa có.

- [ ] **Step 4: Thêm email vào modal**

Trong `PremiumReadingCta`, thêm prop và field trước nút PayOS:

```tsx
{requiresCheckoutEmail ? (
  <label className="premium-confirm-email">
    <span>Email đối soát giao dịch</span>
    <input
      name="email"
      type="email"
      autoComplete="email"
      placeholder="ban@email.com"
      required
    />
    <small>Dùng để đối soát và hỗ trợ khôi phục giao dịch.</small>
  </label>
) : null}
```

Chỉ render form dùng xu khi `!requiresCheckoutEmail && hasEnoughCoins`.

- [ ] **Step 5: Đổi CTA FULL của guest sang native popover**

Trong `PersonalizedReportOutline`, thêm `canCheckoutFull`. Nhánh chưa unlock:

```tsx
{canCheckoutFull ? (
  <button
    type="button"
    className="btn btn-primary personal-report-outline-cta"
    popoverTarget={premiumReadingModalId(chartId)}
    data-ad-click="full_offer_clicked"
    data-chart-id={chartId}
  >
    Mở bản FULL 9 chương - {cashLabel(priceCoins)}
  </button>
) : (
  // Giữ nguyên trạng thái signed-in non-owner.
)}
```

Trong premium-hook branch của `FreeOverviewLoader`, đổi Link login thành button:

```tsx
<button
  type="button"
  className="btn btn-primary"
  popoverTarget={premiumReadingModalId(chartId)}
  data-ad-click="full_offer_inline_clicked"
  data-chart-id={chartId}
>
  Mở bản FULL 9 chương
</button>
```

Không đổi login gate dùng để mở 2 phần free còn lại.

- [ ] **Step 6: Render modal cho guest đủ điều kiện**

Trong chart page:

```ts
const requiresCheckoutEmail =
  !user || isCheckoutGuestUser(user);
const canCheckoutFull = Boolean(
  paidFeaturesVisible &&
  (
    user?.role === "ADMIN" ||
    (record.userId ? record.userId === user?.id : !user)
  ),
);
```

Truyền `canCheckoutFull` vào outline. Render `PremiumReadingCta` khi
`canCheckoutFull && featurePrices`, không phụ thuộc `canReadFullOverview`.
Truyền `requiresCheckoutEmail`.

- [ ] **Step 7: Thêm CSS nhỏ cho email field**

Trong `src/app/globals.css`, dùng màu/input hiện có:

```css
.premium-confirm-email {
  display: grid;
  gap: 0.35rem;
  text-align: left;
}

.premium-confirm-email input {
  min-height: 48px;
  width: 100%;
}

.premium-confirm-email small {
  color: var(--color-stone-500);
  line-height: 1.5;
}
```

Nếu token CSS `--color-stone-500` không tồn tại, dùng đúng biến/text color đang
có trong block `.premium-confirm-*`; không thêm palette mới.

- [ ] **Step 8: Chạy test**

Run:

```powershell
npm test -- src/components/premium-reading-cta.test.ts src/components/personalized-report-outline.test.ts src/components/free-overview-loader.test.ts
```

Expected: PASS; guest FULL CTA dùng popover, login gate free vẫn giữ nguyên.

- [ ] **Step 9: Commit**

```powershell
git add src/components/premium-reading-cta.tsx src/components/premium-reading-cta.test.ts src/components/personalized-report-outline.tsx src/components/personalized-report-outline.test.ts src/components/free-overview-loader.tsx src/components/free-overview-loader.test.ts "src/app/la-so/[id]/page.tsx" src/app/globals.css
git commit -m "feat: streamline guest full reading funnel"
```

### Task 4: Khôi phục guest session và xác minh thanh toán khi return

**Files:**
- Modify: `src/app/api/payments/payos/full-return/route.ts`
- Modify: `src/app/api/payments/payos/full-return/route.test.ts`
- Modify: `docs/agent/playbooks.md`
- Modify: `docs/agent/current-state.md`

**Interfaces:**
- Consumes: `consumeMagicSessionToken(token: string)`
- Preserves: `settlePaidOrder`, `isPayOSRequestPaid`, owner check

- [ ] **Step 1: Viết test return bằng token**

Mở rộng mock auth:

```ts
const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  consumeMagicSessionToken: vi.fn(),
  // existing mocks...
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  consumeMagicSessionToken: mocks.consumeMagicSessionToken,
}));
```

Thêm test:

```ts
it("restores the guest session from the return token before settling", async () => {
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.consumeMagicSessionToken.mockResolvedValue({ id: "user-1" });

  const { GET } = await import("./route");
  const response = await GET(new Request(
    "http://test.local/api/payments/payos/full-return?token=magic-1&status=success&orderCode=123",
  ));

  expect(mocks.consumeMagicSessionToken).toHaveBeenCalledWith("magic-1");
  expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
  expect(response.headers.get("location")).toContain("/la-so/chart-1/nang-cao");
});

it("rejects an invalid token without querying PayOS", async () => {
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.consumeMagicSessionToken.mockResolvedValue(null);

  const { GET } = await import("./route");
  const response = await GET(new Request(
    "http://test.local/api/payments/payos/full-return?token=bad&orderCode=123",
  ));

  expect(response.headers.get("location")).toContain("/la-so?checkout=invalid");
  expect(mocks.getPayOSPaymentRequest).not.toHaveBeenCalled();
});
```

Giữ test unpaid và owner mismatch hiện có.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run:

```powershell
npm test -- src/app/api/payments/payos/full-return/route.test.ts
```

Expected: FAIL vì route chưa đọc token.

- [ ] **Step 3: Khôi phục user từ token**

Trong route:

```ts
const token = url.searchParams.get("token")?.trim();
const user = token
  ? await consumeMagicSessionToken(token)
  : await getCurrentUser();
```

Giữ thứ tự guard: user/orderCode hợp lệ -> DB order -> owner + metadata -> PayOS
verification -> settlement -> redirect Reading.

- [ ] **Step 4: Chạy test payment routes và webhook**

Run:

```powershell
npm test -- src/app/api/payments/payos/full-return/route.test.ts src/app/api/payments/status/route.test.ts src/app/api/webhooks/payos/route.test.ts src/lib/payos-reading.test.ts
```

Expected: PASS; status và webhook vẫn idempotent, token sai không gọi PayOS.

- [ ] **Step 5: Cập nhật docs vận hành**

Trong `docs/agent/playbooks.md`, thay rule “guests ... see paywall prompts” bằng
quy tắc cụ thể:

```md
- Guests may buy the FULL reading directly after entering an email; they must
  not be treated as an existing authenticated email account.
- Guest return tokens are one-time bearer credentials. Consume them before
  settlement, never copy them into application logs or analytics, and always
  verify order ownership plus PayOS paid state.
```

Trong `docs/agent/current-state.md`, ghi guest FULL checkout là email + PayOS,
trong khi topup/xu và money-only policy links vẫn yêu cầu tài khoản bình thường.

- [ ] **Step 6: Commit**

```powershell
git add src/app/api/payments/payos/full-return/route.ts src/app/api/payments/payos/full-return/route.test.ts docs/agent/playbooks.md docs/agent/current-state.md
git commit -m "feat: verify guest PayOS return"
```

### Task 5: Xác minh toàn bộ funnel và release readiness

**Files:**
- Modify only if verification finds a defect in the files listed above.

**Interfaces:**
- Verifies the complete flow; produces no new abstraction.

- [ ] **Step 1: Chạy diff hygiene và targeted suite**

Run:

```powershell
git diff --check
npm test -- src/lib/auth-login-result.test.ts src/lib/chart-ownership.test.ts src/app/actions-checkout-full.test.ts src/components/premium-reading-cta.test.ts src/components/personalized-report-outline.test.ts src/components/free-overview-loader.test.ts src/app/api/payments/payos/full-return/route.test.ts src/app/api/payments/status/route.test.ts src/app/api/webhooks/payos/route.test.ts src/lib/payos-reading.test.ts
```

Expected: không có whitespace error; toàn bộ targeted tests PASS.

- [ ] **Step 2: Chạy security dependency check**

Run:

```powershell
npm audit --omit=dev
```

Expected: không có critical/high reachable runtime vulnerability. Nếu registry
không truy cập được, ghi rõ là chưa xác minh thay vì bỏ qua im lặng.

- [ ] **Step 3: Chạy project verification**

Chạy tuần tự để tránh timeout do tranh tài nguyên:

```powershell
npm run lint
npm test
npm run build
```

Expected: ESLint PASS, toàn bộ Vitest PASS, Next production build PASS.

- [ ] **Step 4: Browser smoke local trên port 4000**

Khởi động production-like server sau build:

```powershell
npx next start -p 4000
```

Dùng Playwright desktop 1440x900 và mobile 390x844:

1. Lập một lá số guest.
2. Xác nhận luận giải free hiển thị.
3. Bấm CTA FULL inline và CTA outline; cả hai mở cùng modal.
4. Xác nhận modal có đúng một email field, giá và nút PayOS.
5. Submit email sai bị browser chặn.
6. Xác nhận không có link `/dang-nhap` trong CTA FULL.
7. Xác nhận modal không tràn viewport và không có console error.

- [ ] **Step 5: Kiểm tra git scope**

Run:

```powershell
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: chỉ có file trong kế hoạch; không có `.env`, `.next`, log, output hoặc
generated Prisma.

- [ ] **Step 6: Production release khi được yêu cầu**

Run:

```powershell
npm run ship -- "feat: allow guest full reading checkout"
```

Sau release:

- `pm2 describe lasotinhhoa` trỏ tới release mới.
- `.release-commit` khớp SHA đã push.
- Homepage, `/lap-la-so`, chart URL và API public cần thiết trả 200.
- Thực hiện một checkout PayOS an toàn theo `docs/payos-smoke.md`; không tự thanh
  toán thật nếu chưa có phê duyệt giao dịch.
- Xác nhận `purchase` chỉ phát sau `/api/payments/status` trả `verified: true`.
