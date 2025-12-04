export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/jobs/:path*", "/api/jobs/:path*"],
}
