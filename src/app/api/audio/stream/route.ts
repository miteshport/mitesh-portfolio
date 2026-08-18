import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inputUrl = searchParams.get("url") || "";
  const ytIdParam = searchParams.get("id") || "";

  // Extract YouTube ID if URL is provided
  let ytId = ytIdParam;
  if (!ytId && inputUrl) {
    const match = inputUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (match) ytId = match[1];
  }

  // If not a YouTube URL, treat as direct audio stream
  if (!ytId && inputUrl) {
    return NextResponse.json({
      success: true,
      streamUrl: inputUrl,
      title: "Direct Audio Stream",
      artist: "Web Audio Stream",
      artwork:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
    });
  }

  if (!ytId) {
    return NextResponse.json(
      { success: false, error: "Invalid YouTube URL or audio stream." },
      { status: 400 }
    );
  }

  // Multi-Node Fallback Invidious / Piped / Resolver APIs
  const resolverNodes = [
    `https://invidious.privacydev.net/api/v1/videos/${ytId}`,
    `https://vid.puffyan.us/api/v1/videos/${ytId}`,
    `https://invidious.flokinet.to/api/v1/videos/${ytId}`,
    `https://inv.bp.projectsegfau.lt/api/v1/videos/${ytId}`,
  ];

  for (const node of resolverNodes) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(node, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const audioStreams =
          data.adaptiveFormats?.filter(
            (f: any) => f.type && f.type.startsWith("audio/")
          ) || [];

        if (audioStreams.length > 0 && audioStreams[0].url) {
          return NextResponse.json({
            success: true,
            streamUrl: audioStreams[0].url,
            title: data.title || "YouTube Audio Stream",
            artist: data.author || "YouTube Channel",
            artwork: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            duration: data.lengthSeconds || 0,
          });
        }
      }
    } catch {
      // Try next node in parallel
    }
  }

  // Graceful Fallback with oEmbed metadata
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      return NextResponse.json({
        success: true,
        streamUrl: "",
        fallbackYtId: ytId,
        title: oembedData.title || "YouTube Audio Stream",
        artist: oembedData.author_name || "YouTube Creator",
        artwork: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      });
    }
  } catch {}

  return NextResponse.json({
    success: true,
    streamUrl: "",
    fallbackYtId: ytId,
    title: "YouTube Audio Stream",
    artist: "Live Link",
    artwork: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
  });
}
