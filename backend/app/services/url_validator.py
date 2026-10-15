import ipaddress
import socket
from urllib.parse import urlparse


BLOCKED_HOSTNAMES = {
    "localhost",
    "loopback",
    "0.0.0.0",
    "broadcasthost",
    "local",
}

BLOCKED_SUFFIXES = (
    ".localhost",
    ".local",
    ".internal",
    ".corp",
    ".lan",
    ".home",
)


class URLValidationError(ValueError):
    pass


def is_ip_safe(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False

    if (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return False

    if isinstance(ip, ipaddress.IPv4Address):
        cgnat = ipaddress.IPv4Network("100.64.0.0/10")
        benchmarking = ipaddress.IPv4Network("198.18.0.0/15")
        doc_1 = ipaddress.IPv4Network("192.0.2.0/24")
        doc_2 = ipaddress.IPv4Network("198.51.100.0/24")
        doc_3 = ipaddress.IPv4Network("203.0.113.0/24")
        if (
            ip in cgnat
            or ip in benchmarking
            or ip in doc_1
            or ip in doc_2
            or ip in doc_3
        ):
            return False

    return True


def is_hostname_safe(hostname: str) -> bool:
    clean_host = hostname.strip().lower()
    if clean_host.startswith("[") and clean_host.endswith("]"):
        clean_host = clean_host[1:-1]

    if not clean_host:
        return False

    if clean_host in BLOCKED_HOSTNAMES:
        return False

    if any(clean_host.endswith(suffix) for suffix in BLOCKED_SUFFIXES):
        return False

    try:
        ipaddress.ip_address(clean_host)
        return is_ip_safe(clean_host)
    except ValueError:
        pass

    try:
        addr_info = socket.getaddrinfo(clean_host, None)
    except socket.gaierror:
        raise URLValidationError(f"Could not resolve hostname: {hostname}")
    except Exception as exc:
        raise URLValidationError(f"DNS resolution failed for {hostname}: {str(exc)}")

    if not addr_info:
        raise URLValidationError(f"No IP addresses resolved for hostname: {hostname}")

    for item in addr_info:
        resolved_ip = item[4][0]
        if not is_ip_safe(resolved_ip):
            return False

    return True


def validate_target_url(raw_url: str) -> str:
    if not isinstance(raw_url, str):
        raise URLValidationError("URL must be a string")

    stripped = raw_url.strip()
    if not stripped:
        raise URLValidationError("URL cannot be empty")

    try:
        parsed = urlparse(stripped)
    except Exception as exc:
        raise URLValidationError(f"Malformed URL: {str(exc)}")

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        raise URLValidationError(
            f"Unsupported URL scheme: '{parsed.scheme}'. Only 'http' and 'https' are allowed."
        )

    hostname = parsed.hostname
    if not hostname:
        raise URLValidationError("URL is missing a valid hostname")

    if not is_hostname_safe(hostname):
        raise URLValidationError(
            f"Destination host '{hostname}' resolves to an internal or restricted IP address."
        )

    return stripped
