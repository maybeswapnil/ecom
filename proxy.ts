import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ANON_ID_COOKIE = "anon_id";
const FIRST_TOUCH_COOKIE = "first_touch";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const NINETY_DAYS_SECONDS = 60 * 60 * 24 * 90;

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  if (req.nextUrl.pathname.startsWith("/admin")) {
    res = await gateAdmin(req, res);
  }

  if (!req.cookies.get(ANON_ID_COOKIE)) {
    res.cookies.set(ANON_ID_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
    });
  }

  if (!req.cookies.get(FIRST_TOUCH_COOKIE)) {
    const url = req.nextUrl;
    const firstTouch = {
      landing_url: url.pathname + url.search,
      referrer: req.headers.get("referer") ?? null,
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      utm_content: url.searchParams.get("utm_content"),
      utm_term: url.searchParams.get("utm_term"),
      fbclid: url.searchParams.get("fbclid"),
      ts: new Date().toISOString(),
    };
    res.cookies.set(FIRST_TOUCH_COOKIE, JSON.stringify(firstTouch), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: NINETY_DAYS_SECONDS,
      path: "/",
    });
  }

  return res;
}

async function gateAdmin(req: NextRequest, res: NextResponse): Promise<NextResponse> {
  if (req.nextUrl.pathname === "/admin/login") return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and image optimization requests — only run on
     * navigable/document and API requests where attribution matters.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
