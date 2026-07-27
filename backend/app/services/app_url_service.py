import os
from urllib.parse import urlparse

from fastapi import Request


DEFAULT_APP_PUBLIC_URL = "http://localhost:3000"
LOCALHOST_NAMES = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


def _normalize_url(value: str | None) -> str | None:
    if not value:
        return None

    normalized = value.strip().rstrip("/")
    return normalized or None


def _is_local_app_url(value: str | None) -> bool:
    if not value:
        return False

    hostname = urlparse(value).hostname
    return hostname in LOCALHOST_NAMES


def _request_origin(request: Request | None) -> str | None:
    if request is None:
        return None

    origin = _normalize_url(request.headers.get("origin"))
    if origin and urlparse(origin).scheme in {"http", "https"}:
        return origin

    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_host:
        forwarded_proto = request.headers.get("x-forwarded-proto") or request.url.scheme
        return _normalize_url(f"{forwarded_proto}://{forwarded_host}")

    host = request.headers.get("host")
    if host:
        return _normalize_url(f"{request.url.scheme}://{host}")

    return None


def get_app_public_url(request: Request | None = None) -> str:
    configured_url = _normalize_url(os.getenv("APP_PUBLIC_URL"))
    request_origin = _request_origin(request)

    # In local/dev access, users may browse through a LAN/Tailscale IP while
    # APP_PUBLIC_URL is still localhost. Email links must follow the browser
    # origin in that case, otherwise the link opens on the wrong machine.
    if request_origin and (not configured_url or _is_local_app_url(configured_url)):
        return request_origin

    return configured_url or request_origin or DEFAULT_APP_PUBLIC_URL


def build_app_url(path: str, request: Request | None = None) -> str:
    return f"{get_app_public_url(request).rstrip('/')}/{path.lstrip('/')}"
