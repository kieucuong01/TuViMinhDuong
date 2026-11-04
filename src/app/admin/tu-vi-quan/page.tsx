import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import QuanAdmin from "./quan-admin";

export const metadata = { title: "Quản lý Tử Vi Quán", robots: { index: false, follow: false } };

export default async function QuanAdminPage() {
  if ((await getCurrentUser())?.role !== "ADMIN") redirect("/dang-nhap?next=/admin/tu-vi-quan");
  return <QuanAdmin />;
}
