import json
import re
from typing import Optional
from bs4 import BeautifulSoup

from app.models.inspect import VideoEvidenceItem

YOUTUBE_EMBED_PATTERN = re.compile(
    r"(?:https?:)?//(?:www\.)?(?:youtube\.com/(?:embed/|v/)|youtu\.be/|youtube-nocookie\.com/embed/)",
    re.I,
)

VIMEO_EMBED_PATTERN = re.compile(
    r"(?:https?:)?//(?:player\.)?vimeo\.com/(?:video/)?",
    re.I,
)

VIDEO_IFRAME_HOSTS = (
    "fast.wistia.net",
    "wistia.com",
    "loom.com/embed",
    "play.vidyard.com",
    "vidyard.com",
    "players.brightcove.net",
    "dailymotion.com/embed",
    "vzaar.com",
    "sproutvideo.com",
    "kaltura.com",
)

DIRECT_VIDEO_EXTENSIONS = (
    ".mp4",
    ".webm",
    ".ogg",
    ".ogv",
    ".mov",
    ".m3u8",
)

VIDEO_LINK_DOMAINS = (
    "youtube.com/watch",
    "youtu.be/",
    "vimeo.com/",
    "loom.com/share",
    "wistia.com/medias",
)


def detect_videos_in_soup(page_url: str, soup: BeautifulSoup) -> list[VideoEvidenceItem]:
    evidence: list[VideoEvidenceItem] = []
    seen_keys: set[tuple[str, Optional[str]]] = set()

    def add_evidence(
        detection_type: str,
        video_url: Optional[str],
        title_or_context: Optional[str],
        confidence: str,
    ) -> None:
        key = (detection_type, video_url)
        if key in seen_keys:
            return
        seen_keys.add(key)
        evidence.append(
            VideoEvidenceItem(
                detection_type=detection_type,
                source_page_url=page_url,
                video_url=video_url,
                title_or_context=title_or_context,
                confidence=confidence,
            )
        )

    for video_tag in soup.find_all("video"):
        src = video_tag.get("src")
        context = video_tag.get("title") or video_tag.get("aria-label") or "HTML5 Video Element"
        if src:
            add_evidence("html5_video", src, str(context).strip(), "high")
        else:
            found_sources = False
            for source_tag in video_tag.find_all("source"):
                source_src = source_tag.get("src")
                if source_src:
                    found_sources = True
                    add_evidence("html5_video", source_src, str(context).strip(), "high")
            if not found_sources:
                add_evidence("html5_video", None, str(context).strip(), "high")

    for iframe in soup.find_all("iframe"):
        src = (iframe.get("src") or iframe.get("data-src") or "").strip()
        context = iframe.get("title") or iframe.get("name") or "Embedded iframe"

        if not src:
            continue

        if YOUTUBE_EMBED_PATTERN.search(src):
            add_evidence("youtube_embed", src, str(context).strip(), "high")
        elif VIMEO_EMBED_PATTERN.search(src):
            add_evidence("vimeo_embed", src, str(context).strip(), "high")
        elif any(host in src.lower() for host in VIDEO_IFRAME_HOSTS):
            add_evidence("video_iframe", src, str(context).strip(), "high")
        elif "video" in src.lower() or "player" in src.lower():
            add_evidence("video_iframe", src, str(context).strip(), "medium")

    for meta in soup.find_all("meta"):
        prop = (meta.get("property") or meta.get("name") or "").lower()
        content = (meta.get("content") or "").strip()
        if not content:
            continue

        if prop in ("og:video", "og:video:url", "og:video:secure_url"):
            add_evidence("video_metadata", content, "OpenGraph Video Tag", "high")
        elif prop == "twitter:player":
            add_evidence("video_metadata", content, "Twitter Player Card", "high")

    for script in soup.find_all("script", type=re.compile(r"ld\+json", re.I)):
        try:
            if not script.string:
                continue
            data = json.loads(script.string)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict):
                    item_type = str(item.get("@type", "")).lower()
                    if item_type == "videoobject":
                        v_url = item.get("contentUrl") or item.get("embedUrl")
                        v_name = item.get("name") or "Schema.org VideoObject"
                        add_evidence("video_metadata", v_url, str(v_name), "high")
        except Exception:
            pass

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"].strip()
        text = a_tag.get_text(separator=" ", strip=True)
        lower_href = href.lower()

        if any(lower_href.endswith(ext) or ext + "?" in lower_href for ext in DIRECT_VIDEO_EXTENSIONS):
            add_evidence("video_link", href, text or "Direct Video File Link", "medium")
        elif any(vdomain in lower_href for vdomain in VIDEO_LINK_DOMAINS):
            add_evidence("video_link", href, text or "Public Video Platform Link", "medium")
        elif re.search(r"\b(watch video|watch demo|view demo|video overview)\b", text, re.I):
            if not href.startswith("#"):
                add_evidence("video_link", href, f"Anchor text: '{text}'", "low")

    return evidence


def evaluate_video_detection_status(all_evidence: list[VideoEvidenceItem]) -> str:
    if not all_evidence:
        return "no_video_detected"

    has_confirmed = any(
        item.confidence in ("high", "medium")
        and item.detection_type in ("html5_video", "youtube_embed", "vimeo_embed", "video_iframe", "video_metadata")
        for item in all_evidence
    )

    if has_confirmed:
        return "video_detected"

    has_direct_links = any(
        item.confidence == "medium" and item.detection_type == "video_link"
        for item in all_evidence
    )

    if has_direct_links:
        return "video_detected"

    return "possible_video_detected"
