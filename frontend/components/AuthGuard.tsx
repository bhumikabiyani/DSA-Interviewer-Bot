"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
interface AuthGuardProps {
  children: React.ReactNode;
}
const publicPaths = ["/login", "/register"];
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (!isClient) return;
    const token = getAccessToken();
    const isPublicPath = publicPaths.includes(pathname);
    if (!token && !isPublicPath) {
      router.push("/login");
    } else if (token && isPublicPath && pathname !== "/") { // Redirect authenticated users from login/register to home
      router.push("/");
    }
  }, [isClient, pathname, router]);
  if (!isClient) {
    return null; // Render nothing on the server
  }
  const token = getAccessToken();
  const isPublicPath = publicPaths.includes(pathname);
  if (!token && !isPublicPath) {
    return null; // Don't render children if not authenticated and on a protected path
  }
  return <>{children}</>;
}