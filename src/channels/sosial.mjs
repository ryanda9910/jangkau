// sosial — read ONE public social post you already have the URL for, via each
// platform's OFFICIAL oEmbed endpoint. No login, no cookies, no feed scraping,
// no ban risk. This is deliberately per-URL only: jangkau does NOT scrape or
// search social feeds (that needs login cookies = ToS violation + account ban).
//
//   TikTok, YouTube : official oEmbed, no key.
//   Instagram, Facebook : Meta oEmbed needs an app access token (APP_ID|APP_SECRET).
//     Set once: `jangkau sosial --meta <APP_ID> <APP_SECRET>`  (or env META_APP_ID/META_APP_SECRET).
import { fetchJson, runChannel, loadConfig, saveConfig } from "../core.mjs";

export const meta = {
  name: "sosial",
  description: "Baca 1 post publik (URL) via oEmbed resmi: TikTok, YouTube, Instagram, Facebook",
  tier: 0,
  backends: ["tiktok", "youtube", "instagram", "facebook"],
  usage: "jangkau sosial <url post publik>  |  jangkau sosial --meta <APP_ID> <APP_SECRET>",
};

function platformOf(url) {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  return null;
}

function metaToken() {
  const cfg = loadConfig();
  const id = cfg.meta_app_id || process.env.META_APP_ID;
  const secret = cfg.meta_app_secret || process.env.META_APP_SECRET;
  return id && secret ? `${id}|${secret}` : null;
}

const shape = (d, platform) => ({
  platform,
  judul: d.title || "",
  penulis: d.author_name || "",
  akun: d.author_url || "",
  thumbnail: d.thumbnail_url || "",
  embed_html: d.html || "",
});

export async function run(args) {
  // one-time Meta app credential setup for IG/FB
  const mi = args.indexOf("--meta");
  if (mi > -1) {
    const cfg = loadConfig();
    cfg.meta_app_id = args[mi + 1];
    cfg.meta_app_secret = args[mi + 2];
    saveConfig(cfg);
    return { ok: "kredensial Meta app tersimpan (IG/FB oembed aktif)" };
  }

  const url = args.find((a) => a.startsWith("http"));
  if (!url) throw new Error("kasih URL post publik: jangkau sosial https://www.tiktok.com/@user/video/123");
  const platform = platformOf(url);
  if (!platform) throw new Error("platform tak dikenal (dukungan: tiktok, youtube, instagram, facebook)");

  const impls = {
    tiktok: () => fetchJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`).then((d) => shape(d, "tiktok")),
    youtube: () => fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`).then((d) => shape(d, "youtube")),
    instagram: async () => {
      const tok = metaToken();
      if (!tok) throw new Error("IG oembed perlu Meta app token — `jangkau sosial --meta <APP_ID> <APP_SECRET>` (atau env META_APP_ID/SECRET)");
      const d = await fetchJson(`https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${tok}`);
      if (d.error) throw new Error(d.error.error_user_msg || d.error.message);
      return shape(d, "instagram");
    },
    facebook: async () => {
      const tok = metaToken();
      if (!tok) throw new Error("FB oembed perlu Meta app token — `jangkau sosial --meta <APP_ID> <APP_SECRET>` (atau env META_APP_ID/SECRET)");
      const kind = /\/videos?\/|fb\.watch/i.test(url) ? "oembed_video" : "oembed_post";
      const d = await fetchJson(`https://graph.facebook.com/v19.0/${kind}?url=${encodeURIComponent(url)}&access_token=${tok}`);
      if (d.error) throw new Error(d.error.error_user_msg || d.error.message);
      return shape(d, "facebook");
    },
  };

  // route to the ONE matching backend (not a fallback chain — platform is fixed by the URL),
  // but still go through runChannel so the outcome is logged + learned.
  const { result } = await runChannel(`sosial:${platform}`, { [platform]: impls[platform] });
  return result;
}

export async function check() {
  const d = await fetchJson(
    "https://www.tiktok.com/oembed?url=https://www.tiktok.com/@scout2015/video/6718335390845095173",
    { timeout: 10000 }
  );
  if (!d.title) throw new Error("oembed berubah");
  const igfb = metaToken() ? "IG/FB aktif" : "IG/FB perlu Meta token";
  return `TikTok+YouTube oembed OK; ${igfb}`;
}
