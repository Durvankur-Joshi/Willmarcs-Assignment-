import re
from typing import Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

from app.models.inspect import ExtractedHeadings

PRIORITY_KEYWORDS = (
    "about",
    "product",
    "products",
    "features",
    "feature",
    "services",
    "service",
    "solutions",
    "solution",
    "platform",
    "pricing",
    "demo",
    "overview",
    "how-it-works",
)

EXCLUDED_PATH_SUBSTRINGS = (
    "/login",
    "/signin",
    "/signup",
    "/register",
    "/cart",
    "/checkout",
    "/privacy",
    "/terms",
    "/cookie",
    "/careers",
    "/jobs",
    "/legal",
    "/assets/",
    "/cdn-cgi/",
)

EXCLUDED_EXTENSIONS = (
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".css",
    ".js",
    ".json",
    ".xml",
)


def normalize_url(base_url: str, href: str) -> Optional[str]:
    if not href or not isinstance(href, str):
        return None

    cleaned_href = href.strip()
    if cleaned_href.startswith(("#", "javascript:", "mailto:", "tel:", "data:")):
        return None

    try:
        joined = urljoin(base_url, cleaned_href)
        parsed = urlparse(joined)
    except Exception:
        return None

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return None

    netloc = (parsed.netloc or "").lower()
    if not netloc:
        return None

    path = parsed.path or "/"
    path = re.sub(r"/+", "/", path)
    if path != "/" and path.endswith("/"):
        path = path[:-1]

    lower_path = path.lower()
    if any(lower_path.endswith(ext) for ext in EXCLUDED_EXTENSIONS):
        return None

    if any(sub in lower_path for sub in EXCLUDED_PATH_SUBSTRINGS):
        return None

    normalized = f"{scheme}://{netloc}{path}"
    if parsed.query:
        clean_params = [
            param for param in parsed.query.split("&")
            if not param.lower().startswith(("utm_", "fbclid=", "gclid=", "ref="))
        ]
        if clean_params:
            normalized = f"{normalized}?{'&'.join(clean_params)}"

    return normalized


def extract_page_title(soup: BeautifulSoup) -> Optional[str]:
    title_tag = soup.find("title")
    if title_tag and title_tag.string:
        cleaned = re.sub(r"\s+", " ", title_tag.string).strip()
        if cleaned:
            return cleaned

    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        cleaned = re.sub(r"\s+", " ", og_title["content"]).strip()
        if cleaned:
            return cleaned

    h1_tag = soup.find("h1")
    if h1_tag:
        text = h1_tag.get_text(separator=" ", strip=True)
        if text:
            return text

    return None


def extract_meta_description(soup: BeautifulSoup) -> Optional[str]:
    meta_desc = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
    if meta_desc and meta_desc.get("content"):
        desc = re.sub(r"\s+", " ", meta_desc["content"]).strip()
        if desc:
            return desc

    og_desc = soup.find("meta", attrs={"property": re.compile(r"^og:description$", re.I)})
    if og_desc and og_desc.get("content"):
        desc = re.sub(r"\s+", " ", og_desc["content"]).strip()
        if desc:
            return desc

    twitter_desc = soup.find("meta", attrs={"name": re.compile(r"^twitter:description$", re.I)})
    if twitter_desc and twitter_desc.get("content"):
        desc = re.sub(r"\s+", " ", twitter_desc["content"]).strip()
        if desc:
            return desc

    return None


def extract_headings(soup: BeautifulSoup) -> ExtractedHeadings:
    headings = ExtractedHeadings()

    for h1 in soup.find_all("h1"):
        text = re.sub(r"\s+", " ", h1.get_text(separator=" ", strip=True)).strip()
        if text and text not in headings.h1:
            headings.h1.append(text)

    for h2 in soup.find_all("h2"):
        text = re.sub(r"\s+", " ", h2.get_text(separator=" ", strip=True)).strip()
        if text and text not in headings.h2:
            headings.h2.append(text)

    for h3 in soup.find_all("h3"):
        text = re.sub(r"\s+", " ", h3.get_text(separator=" ", strip=True)).strip()
        if text and text not in headings.h3:
            headings.h3.append(text)

    return headings


def extract_main_visible_text(soup: BeautifulSoup) -> str:
    clone = BeautifulSoup(str(soup), "html.parser")

    for tag in clone(
        [
            "script",
            "style",
            "noscript",
            "svg",
            "canvas",
            "nav",
            "footer",
            "header",
            "form",
        ]
    ):
        tag.decompose()

    for element in clone.find_all(
        attrs={
            "class": re.compile(
                r"(cookie|banner|modal|popup|consent|advertisement|newsletter|toast)",
                re.I,
            )
        }
    ):
        element.decompose()

    for element in clone.find_all(
        attrs={
            "id": re.compile(
                r"(cookie|banner|modal|popup|consent|advertisement|newsletter|toast)",
                re.I,
            )
        }
    ):
        element.decompose()

    raw_text = clone.get_text(separator="\n", strip=True)
    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in raw_text.splitlines()
        if len(line.strip()) > 2
    ]

    seen = set()
    deduped_lines: list[str] = []
    for line in lines:
        if line not in seen:
            seen.add(line)
            deduped_lines.append(line)

    return "\n".join(deduped_lines[:200])


def discover_relevant_links(base_url: str, soup: BeautifulSoup) -> list[str]:
    parsed_base = urlparse(base_url)
    base_host = (parsed_base.netloc or "").lower()

    scored_links: list[tuple[int, str]] = []
    seen_urls = set()

    normalized_base = normalize_url(base_url, base_url)
    if normalized_base:
        seen_urls.add(normalized_base)

    for a_tag in soup.find_all("a", href=True):
        raw_href = a_tag["href"]
        norm = normalize_url(base_url, raw_href)
        if not norm:
            continue

        parsed_norm = urlparse(norm)
        norm_host = (parsed_norm.netloc or "").lower()
        if norm_host != base_host:
            continue

        if norm in seen_urls:
            continue

        seen_urls.add(norm)
        path = parsed_norm.path.lower()
        anchor_text = a_tag.get_text(separator=" ", strip=True).lower()

        score = 0
        for keyword in PRIORITY_KEYWORDS:
            if keyword in path:
                score += 3
            if keyword in anchor_text:
                score += 2

        if score > 0:
            scored_links.append((score, norm))

    scored_links.sort(key=lambda item: (-item[0], len(item[1])))
    return [url for _, url in scored_links]


def generate_factual_summary(
    title: Optional[str],
    meta_desc: Optional[str],
    headings: ExtractedHeadings,
    visible_text: str,
) -> str:
    parts: list[str] = []

    if title:
        parts.append(f"Website Title: {title}.")

    if meta_desc:
        parts.append(f"Overview: {meta_desc}.")

    primary_headings: list[str] = []
    if headings.h1:
        primary_headings.extend(headings.h1[:2])
    if headings.h2:
        primary_headings.extend(headings.h2[:3])

    if primary_headings:
        joined_headings = "; ".join(primary_headings)
        parts.append(f"Key Headings: {joined_headings}.")

    paragraphs = [p.strip() for p in visible_text.splitlines() if len(p.strip()) > 40]
    for p in paragraphs:
        if len(p) < 300 and not any(p in part for part in parts):
            parts.append(p)
            if len(parts) >= 4:
                break

    if not parts:
        return "No descriptive text could be extracted from the target website."

    return " ".join(parts)
