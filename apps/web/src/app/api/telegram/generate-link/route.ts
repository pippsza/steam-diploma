import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

function generateCode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await getPayload({ config });

  // Check if this is an unlink request
  let body: { unlink?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // no body = generate code
  }

  if (body.unlink) {
    await payload.update({
      collection: "users",
      id: session.user.id,
      data: {
        telegramChatId: "",
        telegramUsername: "",
        telegramLinked: false,
        telegramLinkToken: "",
        telegramLinkExpiry: undefined,
      } as never,
    });
    return NextResponse.json({ success: true });
  }

  const code = generateCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await payload.update({
    collection: "users",
    id: session.user.id,
    data: {
      telegramLinkToken: code,
      telegramLinkExpiry: expiry.toISOString(),
    } as never,
  });

  return NextResponse.json({ code });
}
