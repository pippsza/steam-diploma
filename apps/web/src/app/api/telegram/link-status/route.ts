import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const user = await payload.findByID({
    collection: "users",
    id: session.user.id,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already linked
  if (user.telegramLinked && user.telegramChatId) {
    return NextResponse.json({
      linked: true,
      username: user.telegramUsername,
    });
  }

  // Check if token matches and hasn't expired
  if (user.telegramLinkToken !== token) {
    return NextResponse.json({ linked: false, expired: true });
  }

  const expiry = user.telegramLinkExpiry
    ? new Date(user.telegramLinkExpiry)
    : null;
  if (!expiry || expiry < new Date()) {
    return NextResponse.json({ linked: false, expired: true });
  }

  return NextResponse.json({ linked: false, expired: false });
}
