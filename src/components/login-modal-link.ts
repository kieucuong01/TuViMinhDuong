function safePath(path: string, fallback = "/") {
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export function cleanLoginModalPath(pathname: string, searchParams?: URLSearchParams | string) {
  const params = new URLSearchParams(typeof searchParams === "string" ? searchParams : searchParams?.toString());
  ["login", "next", "authError"].forEach((key) => params.delete(key));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function loginModalHref(pathname: string, searchParams?: URLSearchParams | string, nextPath?: string) {
  const params = new URLSearchParams(typeof searchParams === "string" ? searchParams : searchParams?.toString());
  params.set("login", "1");
  params.set("next", safePath(nextPath || pathname));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
