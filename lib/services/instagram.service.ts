import axios from "axios";

import { logger } from "@/lib/utils/logger";

interface InstagramPost {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  hashtags: string[];
}

interface CacheEntry {
  data: { posts: InstagramPost[] };
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getFeed(): Promise<{ posts: InstagramPost[] }> {
  const feedUrl = process.env.BEHOLD_FEED_URL;
  if (!feedUrl) {
    return { posts: [] };
  }

  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  try {
    const response = await axios.get(feedUrl);
    const raw = response.data?.posts || (Array.isArray(response.data) ? response.data : []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: InstagramPost[] = raw.slice(0, 12).map((post: any) => ({
      id: post.id,
      caption: post.caption || post.prunedCaption || "",
      media_type: post.mediaType,
      media_url:
        post.sizes?.medium?.mediaUrl || post.sizes?.large?.mediaUrl || post.mediaUrl,
      permalink: post.permalink,
      timestamp: post.timestamp,
      hashtags: post.hashtags || [],
    }));

    cache = { data: { posts }, timestamp: now };
    return { posts };
  } catch (error) {
    logger.error("Instagram Feed Error: " + (error instanceof Error ? error.message : String(error)));
    if (cache) return cache.data;
    return { posts: [] };
  }
}
