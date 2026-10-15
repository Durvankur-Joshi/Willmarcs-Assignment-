from dataclasses import dataclass
from typing import Optional
from urllib.parse import urljoin
import requests

from app.services.url_validator import URLValidationError, validate_target_url

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36 VideoOpportunityAnalyzer/1.0"
)

DEFAULT_TIMEOUT = 8.0
DEFAULT_MAX_REDIRECTS = 5
DEFAULT_MAX_BYTES = 2 * 1024 * 1024


@dataclass
class SafeFetchResult:
    url: str
    final_url: str
    status_code: int
    content: str
    headers: dict[str, str]
    error: Optional[str] = None


class SafeFetchError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def safe_fetch_html(
    url: str,
    timeout: float = DEFAULT_TIMEOUT,
    max_redirects: int = DEFAULT_MAX_REDIRECTS,
    max_bytes: int = DEFAULT_MAX_BYTES,
) -> SafeFetchResult:
    current_url = validate_target_url(url)
    visited_urls = {current_url}

    session = requests.Session()
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
    }

    redirect_count = 0
    try:
        while True:
            try:
                response = session.get(
                    current_url,
                    headers=headers,
                    timeout=timeout,
                    allow_redirects=False,
                    stream=True,
                )
            except requests.exceptions.Timeout:
                raise SafeFetchError(f"Request timed out while connecting to {current_url}")
            except requests.exceptions.SSLError as exc:
                raise SafeFetchError(f"SSL certificate verification failed: {str(exc)}")
            except requests.exceptions.ConnectionError as exc:
                raise SafeFetchError(f"Connection error reaching {current_url}: {str(exc)}")
            except requests.exceptions.RequestException as exc:
                raise SafeFetchError(f"Network error while fetching {current_url}: {str(exc)}")

            if response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    raise SafeFetchError(f"Redirect status {response.status_code} received without Location header")

                redirect_count += 1
                if redirect_count > max_redirects:
                    raise SafeFetchError(f"Maximum redirect limit ({max_redirects}) exceeded")

                next_url = urljoin(current_url, location)
                try:
                    next_url = validate_target_url(next_url)
                except URLValidationError as exc:
                    raise SafeFetchError(f"Redirect blocked for safety: {str(exc)}")

                if next_url in visited_urls:
                    raise SafeFetchError(f"Infinite redirect loop detected to {next_url}")

                visited_urls.add(next_url)
                current_url = next_url
                response.close()
                continue

            if response.status_code >= 400:
                response.close()
                raise SafeFetchError(
                    f"HTTP error {response.status_code} returned by {current_url}",
                    status_code=response.status_code,
                )

            content_type = response.headers.get("Content-Type", "").lower()
            if not any(t in content_type for t in ("text/html", "application/xhtml+xml", "text/xml")):
                response.close()
                raise SafeFetchError(
                    f"Target returned non-HTML Content-Type: '{content_type}'",
                    status_code=response.status_code,
                )

            raw_chunks: list[bytes] = []
            total_bytes = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        response.close()
                        raise SafeFetchError(f"Response size exceeded limit of {max_bytes} bytes")
                    raw_chunks.append(chunk)

            response.close()
            encoding = response.encoding or "utf-8"
            raw_data = b"".join(raw_chunks)
            try:
                html_text = raw_data.decode(encoding, errors="replace")
            except (LookupError, UnicodeDecodeError):
                html_text = raw_data.decode("utf-8", errors="replace")

            return SafeFetchResult(
                url=url,
                final_url=current_url,
                status_code=response.status_code,
                content=html_text,
                headers=dict(response.headers),
            )

    finally:
        session.close()
