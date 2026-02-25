import { NextRequest, NextResponse } from "next/server";

/**
 * PayTabs sends a POST request to the return URL after payment.
 * Next.js App Router pages only handle GET requests.
 * This Route Handler at /api/paytabs-return accepts the POST from PayTabs,
 * extracts all form fields, and redirects the user to the payment-result page
 * as a GET request with query params — fixing the 405 error.
 *
 * ✅ Set PAYTABS_RETURN_URL=https://app.nexustoolz.com/api/paytabs-return in .env
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const params = new URLSearchParams();

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const formData = new URLSearchParams(text);
      formData.forEach((value, key) => {
        params.set(key, value);
      });
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      Object.entries(body).forEach(([key, value]) => {
        params.set(key, String(value));
      });
    } else {
      // Try to parse as form-encoded anyway
      try {
        const text = await req.text();
        const formData = new URLSearchParams(text);
        formData.forEach((value, key) => {
          params.set(key, value);
        });
      } catch {
        // Ignore parse errors, still redirect to result page
      }
    }

    const baseUrl = req.nextUrl.origin;
    const redirectUrl = `${baseUrl}/payment-result?${params.toString()}`;

    // 303 See Other — tells the browser to do a GET on the redirect URL
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error("[PayTabs Return] Error processing return:", error);
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/payment-result?status=error`, { status: 303 });
  }
}

// Also handle GET in case of browser direct navigation
export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams.toString();
  const redirectUrl = `${baseUrl}/payment-result${searchParams ? `?${searchParams}` : ""}`;
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
