from typing import Optional
from bs4 import BeautifulSoup

from app.models.inspect import (
    PageInspectionResult,
    VideoEvidenceItem,
    WebsiteInspectResponse,
)
from app.services.content_extractor import (
    discover_relevant_links,
    extract_headings,
    extract_main_visible_text,
    extract_meta_description,
    extract_page_title,
    generate_factual_summary,
)
from app.services.http_client import SafeFetchError, safe_fetch_html
from app.services.url_validator import URLValidationError, validate_target_url
from app.services.video_detector import (
    detect_videos_in_soup,
    evaluate_video_detection_status,
)


def inspect_website(
    target_url: str,
    max_additional_pages: int = 3,
) -> WebsiteInspectResponse:
    try:
        validated_url = validate_target_url(target_url)
    except URLValidationError as exc:
        return WebsiteInspectResponse(
            requested_url=target_url,
            final_url=None,
            status="failed",
            video_detection="no_video_detected",
            pages_inspected=[
                PageInspectionResult(
                    url=target_url,
                    status="failed",
                    error_message=str(exc),
                )
            ],
            warnings_and_limitations=["Inspection rejected due to URL safety validation failure."],
            error_message=str(exc),
        )

    try:
        home_result = safe_fetch_html(validated_url)
    except SafeFetchError as exc:
        return WebsiteInspectResponse(
            requested_url=target_url,
            final_url=None,
            status="failed",
            video_detection="no_video_detected",
            pages_inspected=[
                PageInspectionResult(
                    url=validated_url,
                    status_code=exc.status_code,
                    status="failed",
                    error_message=exc.message,
                )
            ],
            warnings_and_limitations=["Could not fetch homepage content."],
            error_message=exc.message,
        )

    home_soup = BeautifulSoup(home_result.content, "html.parser")
    title = extract_page_title(home_soup)
    meta_desc = extract_meta_description(home_soup)
    headings = extract_headings(home_soup)
    visible_text = extract_main_visible_text(home_soup)
    factual_summary = generate_factual_summary(title, meta_desc, headings, visible_text)

    discovered_pages = discover_relevant_links(home_result.final_url, home_soup)

    pages_inspected: list[PageInspectionResult] = [
        PageInspectionResult(
            url=home_result.final_url,
            title=title,
            status_code=home_result.status_code,
            status="crawled",
        )
    ]

    all_video_evidence: list[VideoEvidenceItem] = []
    all_video_evidence.extend(detect_videos_in_soup(home_result.final_url, home_soup))

    has_partial_failure = False
    additional_candidates = discovered_pages[:max_additional_pages]

    for subpage_url in additional_candidates:
        try:
            subpage_result = safe_fetch_html(subpage_url)
            subpage_soup = BeautifulSoup(subpage_result.content, "html.parser")
            sub_title = extract_page_title(subpage_soup)

            pages_inspected.append(
                PageInspectionResult(
                    url=subpage_result.final_url,
                    title=sub_title,
                    status_code=subpage_result.status_code,
                    status="crawled",
                )
            )

            subpage_videos = detect_videos_in_soup(subpage_result.final_url, subpage_soup)
            all_video_evidence.extend(subpage_videos)

        except (SafeFetchError, URLValidationError) as exc:
            has_partial_failure = True
            pages_inspected.append(
                PageInspectionResult(
                    url=subpage_url,
                    status="failed",
                    error_message=str(exc),
                )
            )

    video_status = evaluate_video_detection_status(all_video_evidence)

    overall_status = "partial_success" if has_partial_failure else "success"

    crawled_count = sum(1 for p in pages_inspected if p.status == "crawled")
    warnings: list[str] = [
        f"Inspection completed across {crawled_count} page(s) on target domain.",
        "Video detection is limited to static HTML5 tags, embedded iframes (YouTube, Vimeo, Wistia, etc.), video links, and metadata.",
        "Videos rendered dynamically via client-side JavaScript or behind login authentication were not evaluated.",
    ]

    if has_partial_failure:
        warnings.append("One or more additional subpages could not be retrieved and were excluded from analysis.")

    return WebsiteInspectResponse(
        requested_url=target_url,
        final_url=home_result.final_url,
        status=overall_status,
        title=title,
        meta_description=meta_desc,
        factual_summary=factual_summary,
        headings=headings,
        pages_inspected=pages_inspected,
        discovered_relevant_pages=discovered_pages,
        video_detection=video_status,
        video_evidence=all_video_evidence,
        warnings_and_limitations=warnings,
        error_message=None,
    )
