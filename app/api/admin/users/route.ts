import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { getCachedUsers, updateAdminUsersCache } from "@/lib/admin-cache";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    const sortBy = searchParams.get("sortBy") || "points";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      await updateAdminUsersCache();
    }

    let result = await getCachedUsers();

    // Filtering
    if (q) {
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.referralCode.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy !== "points" || sortOrder !== "desc") {
      result = [...result].sort((a, b) => {
        const valA = a[sortBy as keyof typeof a];
        const valB = b[sortBy as keyof typeof b];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        if (typeof valA === "boolean" && typeof valB === "boolean") {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
        return 0;
      });
    }

    // Return the full list without limits
    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Admin API Error:", error);
    return adminUnauthorizedResponse();
  }
}
