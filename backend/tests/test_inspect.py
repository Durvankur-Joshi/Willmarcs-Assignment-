import socket
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest
import requests

from app.main import app
from app.services.http_client import SafeFetchError, safe_fetch_html
from app.services.url_validator import (
    URLValidationError,
    is_hostname_safe,
    is_ip_safe,
    validate_target_url,
)
from app.services.website_reader import inspect_website

client = TestClient(app)


def test_url_validator_valid_schemes():
    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]):
        assert validate_target_url("https://example.com") == "https://example.com"
        assert validate_target_url("http://example.com/path") == "http://example.com/path"


def test_url_validator_invalid_schemes():
    with pytest.raises(URLValidationError, match="Unsupported URL scheme"):
        validate_target_url("ftp://example.com")

    with pytest.raises(URLValidationError, match="Unsupported URL scheme"):
        validate_target_url("javascript:alert(1)")

    with pytest.raises(URLValidationError, match="Unsupported URL scheme"):
        validate_target_url("file:///etc/passwd")


def test_url_validator_empty_and_malformed():
    with pytest.raises(URLValidationError, match="cannot be empty"):
        validate_target_url("   ")

    with pytest.raises(URLValidationError, match="missing a valid hostname"):
        validate_target_url("https://")


def test_url_validator_localhost_and_loopback_rejection():
    assert not is_hostname_safe("localhost")
    assert not is_hostname_safe("127.0.0.1")
    assert not is_hostname_safe("::1")
    assert not is_hostname_safe("sub.localhost")

    with pytest.raises(URLValidationError, match="internal or restricted"):
        validate_target_url("http://localhost:8000")

    with pytest.raises(URLValidationError, match="internal or restricted"):
        validate_target_url("http://127.0.0.1/admin")


def test_url_validator_private_ips_rejection():
    assert not is_ip_safe("10.0.0.1")
    assert not is_ip_safe("172.16.0.5")
    assert not is_ip_safe("192.168.1.1")
    assert not is_ip_safe("169.254.169.254")

    with pytest.raises(URLValidationError, match="internal or restricted"):
        validate_target_url("http://192.168.1.100")

    with pytest.raises(URLValidationError, match="internal or restricted"):
        validate_target_url("http://10.200.0.1")


def test_url_validator_ssrf_dns_resolution_to_private():
    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("127.0.0.1", 0))]):
        assert not is_hostname_safe("evil-private-host.com")
        with pytest.raises(URLValidationError, match="internal or restricted"):
            validate_target_url("http://evil-private-host.com")


def test_safe_fetch_redirect_safety():
    mock_response_redirect = MagicMock()
    mock_response_redirect.status_code = 302
    mock_response_redirect.headers = {"Location": "http://127.0.0.1/secret"}

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response_redirect):
        with pytest.raises(SafeFetchError, match="Redirect blocked for safety"):
            safe_fetch_html("https://example.com")


def test_safe_fetch_redirect_loop():
    mock_response_redirect = MagicMock()
    mock_response_redirect.status_code = 301
    mock_response_redirect.headers = {"Location": "https://example.com/loop"}

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response_redirect):
        with pytest.raises(SafeFetchError, match="Infinite redirect loop detected"):
            safe_fetch_html("https://example.com/loop")


def test_safe_fetch_non_html_response():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "application/pdf"}

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        with pytest.raises(SafeFetchError, match="non-HTML Content-Type"):
            safe_fetch_html("https://example.com/doc.pdf")


def test_safe_fetch_timeout():
    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", side_effect=requests.exceptions.Timeout("Timed out")):
        with pytest.raises(SafeFetchError, match="timed out"):
            safe_fetch_html("https://example.com")


def test_safe_fetch_connection_error():
    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        with pytest.raises(SafeFetchError, match="Connection error"):
            safe_fetch_html("https://example.com")


def test_inspect_website_successful_html_extraction():
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Acme Corp - Cloud Architecture</title>
        <meta name="description" content="Next generation cloud deployment platform." />
      </head>
      <body>
        <nav><a href="/home">Home</a></nav>
        <h1>Modern Cloud Infrastructure</h1>
        <h2>Scalable and Resilient</h2>
        <h3>Built for developers</h3>
        <p>Acme Corp provides automated Kubernetes clustering with real-time scaling.</p>
        <a href="/features">Explore Features</a>
        <a href="/pricing">View Pricing</a>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html; charset=utf-8"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.status == "success"
        assert res.title == "Acme Corp - Cloud Architecture"
        assert res.meta_description == "Next generation cloud deployment platform."
        assert "Modern Cloud Infrastructure" in res.headings.h1
        assert "Scalable and Resilient" in res.headings.h2
        assert "Built for developers" in res.headings.h3
        assert res.factual_summary is not None
        assert "Cloud Architecture" in res.factual_summary
        assert res.video_detection == "no_video_detected"
        assert len(res.pages_inspected) == 1
        assert res.pages_inspected[0].status == "crawled"


def test_inspect_website_missing_title_or_meta_description():
    html = "<html><body><h1>Direct Content Heading</h1><p>No title or meta tag provided.</p></body></html>"
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.status == "success"
        assert res.title == "Direct Content Heading"
        assert res.meta_description is None
        assert res.factual_summary is not None


def test_video_detection_html5_video():
    html = """
    <html>
      <head><title>Product Demo</title></head>
      <body>
        <video controls title="Product Overview Clip">
          <source src="/assets/demo.mp4" type="video/mp4" />
        </video>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.video_detection == "video_detected"
        assert len(res.video_evidence) >= 1
        types = [e.detection_type for e in res.video_evidence]
        assert "html5_video" in types


def test_video_detection_youtube_and_vimeo_iframe():
    html = """
    <html>
      <head><title>Embeds Page</title></head>
      <body>
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Rick Astley"></iframe>
        <iframe src="https://player.vimeo.com/video/76979871" title="Vimeo Short"></iframe>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.video_detection == "video_detected"
        types = [e.detection_type for e in res.video_evidence]
        assert "youtube_embed" in types
        assert "vimeo_embed" in types


def test_video_detection_video_links():
    html = """
    <html>
      <head><title>Link Page</title></head>
      <body>
        <a href="https://youtube.com/watch?v=12345">Watch on YouTube</a>
        <a href="https://example.com/downloads/intro.mp4">Download MP4</a>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.video_detection == "video_detected"
        types = [e.detection_type for e in res.video_evidence]
        assert "video_link" in types


def test_video_detection_possible_video_link():
    html = """
    <html>
      <head><title>Generic Page</title></head>
      <body>
        <a href="/company/watch-video">Watch Video</a>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.video_detection == "possible_video_detected"


def test_inspect_website_partial_success_when_subpage_fails():
    home_html = """
    <html>
      <head><title>Home Page</title></head>
      <body>
        <h1>Welcome</h1>
        <a href="/features">Features Page</a>
      </body>
    </html>
    """
    mock_home = MagicMock()
    mock_home.status_code = 200
    mock_home.headers = {"Content-Type": "text/html"}
    mock_home.encoding = "utf-8"
    mock_home.iter_content.return_value = [home_html.encode("utf-8")]

    def session_get_router(*args, **kwargs):
        url_str = ""
        for a in args:
            if isinstance(a, str):
                url_str = a
                break
        if not url_str and "url" in kwargs:
            url_str = str(kwargs["url"])

        if "features" in url_str:
            mock_fail = MagicMock()
            mock_fail.status_code = 500
            return mock_fail
        return mock_home

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", side_effect=session_get_router):
        res = inspect_website("https://example.com", max_additional_pages=1)
        assert res.status == "partial_success"
        assert res.title == "Home Page"
        assert len(res.pages_inspected) == 2
        statuses = [p.status for p in res.pages_inspected]
        assert "crawled" in statuses
        assert "failed" in statuses


def test_api_inspect_endpoint_validation():
    response = client.post("/api/website/inspect", json={"url": "not-a-valid-url"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "failed"
    assert "error_message" in data
    assert data["error_message"] is not None


def test_api_inspect_endpoint_success():
    html = "<html><head><title>API Test</title></head><body><h1>API Heading</h1></body></html>"
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        response = client.post("/api/website/inspect", json={"url": "https://example.com", "max_additional_pages": 0})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["title"] == "API Test"
        assert "API Heading" in data["headings"]["h1"]
        assert data["video_detection"] == "no_video_detected"


def test_safe_fetch_max_bytes_exceeded():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.iter_content.return_value = [b"A" * 1024, b"B" * 1024]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        with pytest.raises(SafeFetchError, match="Response size exceeded limit"):
            safe_fetch_html("https://example.com", max_bytes=1000)


def test_safe_fetch_large_page_within_limit():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [b"<html>3MB page content</html>" + b" " * (3 * 1024 * 1024)]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        result = safe_fetch_html("https://example.com")
        assert result.status_code == 200
        assert "3MB page content" in result.content


def test_safe_fetch_max_redirects_exceeded():
    mock_response_redirect = MagicMock()
    mock_response_redirect.status_code = 302
    mock_response_redirect.headers = {"Location": "https://example.com/next"}

    counter = {"count": 0}

    def redirect_router(url, *args, **kwargs):
        counter["count"] += 1
        res = MagicMock()
        res.status_code = 302
        res.headers = {"Location": f"https://example.com/step{counter['count']}"}
        return res

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", side_effect=redirect_router):
        with pytest.raises(SafeFetchError, match="Maximum redirect limit"):
            safe_fetch_html("https://example.com/start", max_redirects=3)


def test_inspect_website_homepage_404():
    mock_response = MagicMock()
    mock_response.status_code = 404

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com/notfound")
        assert res.status == "failed"
        assert res.error_message is not None
        assert "404" in res.error_message


def test_video_detection_metadata_opengraph_and_jsonld():
    html = """
    <html>
      <head>
        <title>Media Showcase</title>
        <meta property="og:video" content="https://example.com/teaser.mp4" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          "name": "Platform Explainer",
          "contentUrl": "https://example.com/explainer.mp4"
        }
        </script>
      </head>
      <body>
        <h1>Showcase</h1>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "text/html"}
    mock_response.encoding = "utf-8"
    mock_response.iter_content.return_value = [html.encode("utf-8")]

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", return_value=mock_response):
        res = inspect_website("https://example.com", max_additional_pages=0)
        assert res.video_detection == "video_detected"
        types = [e.detection_type for e in res.video_evidence]
        assert "video_metadata" in types
        assert len(res.video_evidence) >= 2


def test_inspect_website_multiple_pages_success():
    home_html = """
    <html>
      <head><title>Home Page</title></head>
      <body>
        <h1>Welcome</h1>
        <a href="/about">About Us</a>
      </body>
    </html>
    """
    about_html = """
    <html>
      <head><title>About Us</title></head>
      <body>
        <h1>About Our Team</h1>
        <video src="https://example.com/team.mp4"></video>
      </body>
    </html>
    """

    def session_router(*args, **kwargs):
        url_str = ""
        for a in args:
            if isinstance(a, str):
                url_str = a
                break
        if not url_str and "url" in kwargs:
            url_str = str(kwargs["url"])

        res = MagicMock()
        res.status_code = 200
        res.headers = {"Content-Type": "text/html"}
        res.encoding = "utf-8"
        if "about" in url_str:
            res.iter_content.return_value = [about_html.encode("utf-8")]
        else:
            res.iter_content.return_value = [home_html.encode("utf-8")]
        return res

    with patch("socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]), \
         patch("requests.Session.get", side_effect=session_router):
        res = inspect_website("https://example.com", max_additional_pages=1)
        assert res.status == "success"
        assert len(res.pages_inspected) == 2
        assert res.video_detection == "video_detected"
        assert any(e.source_page_url.endswith("/about") for e in res.video_evidence)

