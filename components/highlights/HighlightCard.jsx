"use client";
import { buildHlsUrl, buildPoster } from "@/lib/highlights";

export default function HighlightCard({ item }) {
  const { title, slug, type, url, publicId, posterUrl } = item;
  const hls = type === "video" ? buildHlsUrl(publicId) : null;
  const poster = buildPoster(publicId, posterUrl);

  return (
    <a href={`/highlights/${slug}`} className="block">
      {type === "video" ? (
        <div className="aspect-video bg-base-200">
          <video
            className="w-full h-full object-cover"
            playsInline
            muted
            preload="metadata"
            poster={poster}
          >
            {hls && <source src={hls} type="application/x-mpegURL" />}
            <source src={url} type="video/mp4" />
          </video>
        </div>
      ) : (
        <img src={url} alt={title} className="w-full h-auto object-cover" />
      )}
      <div className="p-3">
        <h3 className="font-semibold line-clamp-1">{title}</h3>
      </div>
    </a>
  );
}
