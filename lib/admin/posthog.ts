const POSTHOG_API_HOST = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

export interface TrafficOverview {
  configured: boolean;
  pageviews7d: number;
  uniqueVisitors7d: number;
  pageviews30d: number;
  uniqueVisitors30d: number;
  topPages: { path: string; views: number }[];
}

const EMPTY_OVERVIEW: TrafficOverview = {
  configured: false,
  pageviews7d: 0,
  uniqueVisitors7d: 0,
  pageviews30d: 0,
  uniqueVisitors30d: 0,
  topPages: [],
};

async function runHogQL<T = unknown[]>(query: string): Promise<T[]> {
  const response = await fetch(
    `${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`PostHog query failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { results: T[] };
  return body.results;
}

export async function getTrafficOverview(): Promise<TrafficOverview> {
  if (!POSTHOG_PROJECT_ID || !POSTHOG_PERSONAL_API_KEY) {
    return EMPTY_OVERVIEW;
  }

  try {
    const [counts7d, counts30d, topPages] = await Promise.all([
      runHogQL<[number, number]>(
        `SELECT count(), count(DISTINCT person_id) FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY`,
      ),
      runHogQL<[number, number]>(
        `SELECT count(), count(DISTINCT person_id) FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 30 DAY`,
      ),
      runHogQL<[string, number]>(
        `SELECT properties.$pathname AS path, count() AS views FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
         GROUP BY path ORDER BY views DESC LIMIT 10`,
      ),
    ]);

    const [pageviews7d, uniqueVisitors7d] = counts7d[0] ?? [0, 0];
    const [pageviews30d, uniqueVisitors30d] = counts30d[0] ?? [0, 0];

    return {
      configured: true,
      pageviews7d,
      uniqueVisitors7d,
      pageviews30d,
      uniqueVisitors30d,
      topPages: topPages.map(([path, views]) => ({ path: path ?? "(unknown)", views })),
    };
  } catch {
    return EMPTY_OVERVIEW;
  }
}
