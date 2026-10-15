import json
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.analysis import AnalyzeRequest, AnalyzeResponse
from app.models.inspect import (
    ExtractedHeadings,
    PageInspectionResult,
    WebsiteInspectResponse,
)
from app.services.ai_analyzer import (
    GeminiAnalysisError,
    GeminiConfigError,
    construct_analysis_prompt,
    count_words,
    generate_ai_analysis,
    get_gemini_api_key,
    parse_and_validate_ai_response,
    trim_email_to_limit,
)

client = TestClient(app)


def create_sample_inspection(
    status: str = "success",
    error_message: str | None = None,
) -> WebsiteInspectResponse:
    return WebsiteInspectResponse(
        requested_url="https://acme.org",
        final_url="https://acme.org",
        status=status,
        title="Acme Automation - B2B Workflow Platform",
        meta_description="Automate complex cross-functional workflows across CRM and data pipelines.",
        factual_summary="Website Title: Acme Automation. Automate complex cross-functional workflows.",
        headings=ExtractedHeadings(
            h1=["Automate Enterprise Operations"],
            h2=["Seamless Integrations", "Security at Scale", "Transparent Pricing"],
            h3=["REST API Support"],
        ),
        pages_inspected=[
            PageInspectionResult(
                url="https://acme.org",
                title="Acme Automation",
                status_code=200,
                status="crawled",
            ),
            PageInspectionResult(
                url="https://acme.org/features",
                title="Features & APIs",
                status_code=200,
                status="crawled",
            ),
            PageInspectionResult(
                url="https://acme.org/pricing",
                title="Plans & Pricing",
                status_code=200,
                status="crawled",
            ),
        ],
        discovered_relevant_pages=["https://acme.org/features", "https://acme.org/pricing"],
        video_detection="no_video_detected",
        video_evidence=[],
        warnings_and_limitations=["Inspection covered 3 pages on target domain."],
        error_message=error_message,
    )


def create_mock_ai_json(email_body_word_count: int = 90) -> str:
    body_words = [f"word{i}" for i in range(email_body_word_count)]
    body_text = " ".join(body_words) + ".\n\nBest regards"

    return json.dumps(
        {
            "recommendations": [
                {
                    "title": "Homepage Interactive Workflow Explainer",
                    "video_type": "Product Explainer",
                    "suggested_placement": "Homepage Hero section above the fold",
                    "rationale": "Visitors currently face dense architecture text; a 60s video clarifies core value proposition immediately.",
                    "evidence": "Homepage inspected has H1 'Automate Enterprise Operations' with 1,200 words of technical text and 0 video embeds.",
                    "source_page_url": "https://acme.org",
                    "target_audience": "Technical operations decision makers",
                    "suggested_outline": "Shows manual CRM entry pain points, reveals Acme 1-click sync, and finishes with live metrics dashboard.",
                    "evidence_limitations": "Crawl evaluated static landing page only.",
                },
                {
                    "title": "API & CRM Integration Walkthrough",
                    "video_type": "Product Demo",
                    "suggested_placement": "Features & Developer Docs page",
                    "rationale": "Engineers evaluating REST API support need visual confirmation of SDK setup.",
                    "evidence": "Inspected /features page highlights H3 'REST API Support' with step-by-step code blocks.",
                    "source_page_url": "https://acme.org/features",
                    "target_audience": "Software architects and integration engineers",
                    "suggested_outline": "Step-by-step webhook configuration and JSON response validation.",
                    "evidence_limitations": None,
                },
                {
                    "title": "Enterprise ROI & Pricing Breakdown",
                    "video_type": "Customer Proof Highlight",
                    "suggested_placement": "Pricing page next to Enterprise Tier",
                    "rationale": "High-tier prospects require quantifiable efficiency ROI before booking an enterprise sales consultation.",
                    "evidence": "Inspected /pricing page displays 3 pricing tiers with text-only feature lists.",
                    "source_page_url": "https://acme.org/pricing",
                    "target_audience": "Enterprise procurement and VP Operations",
                    "suggested_outline": "Examines time saved per employee with customer ROI metrics.",
                    "evidence_limitations": None,
                },
            ],
            "outreach_email": {
                "subject": "Quick video idea for Acme Automation",
                "body": body_text,
                "word_count": email_body_word_count,
            },
        }
    )


def test_missing_api_key_raises_config_error(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    with pytest.raises(GeminiConfigError, match="GEMINI_API_KEY is not configured"):
        get_gemini_api_key()

    monkeypatch.setenv("GEMINI_API_KEY", "your_gemini_api_key_here")
    with pytest.raises(GeminiConfigError, match="GEMINI_API_KEY is not configured"):
        get_gemini_api_key()


def test_count_words():
    assert count_words("") == 0
    assert count_words("   ") == 0
    assert count_words("Hello world") == 2
    assert count_words("Line one\n\nLine two with   tabs\tand spaces") == 8


def test_trim_email_to_limit():
    short_text = "This is a brief email under the limit.\n\nBest regards"
    assert trim_email_to_limit(short_text, max_words=119) == short_text

    long_text = " ".join([f"word{i}" for i in range(150)])
    trimmed = trim_email_to_limit(long_text, max_words=110)
    assert count_words(trimmed) <= 119
    assert "Best regards" in trimmed


def test_construct_analysis_prompt():
    inspection = create_sample_inspection()
    prompt = construct_analysis_prompt(inspection)
    assert "https://acme.org" in prompt
    assert "Acme Automation" in prompt
    assert "Automate Enterprise Operations" in prompt
    assert "SECURITY INSTRUCTION" in prompt
    assert "EXACTLY 3 distinct recommendations" in prompt


def test_parse_and_validate_ai_response_success():
    inspection = create_sample_inspection()
    raw_json = create_mock_ai_json(email_body_word_count=85)
    result = parse_and_validate_ai_response(raw_json, inspection)

    assert len(result.recommendations) == 3
    assert result.recommendations[0].title == "Homepage Interactive Workflow Explainer"
    assert result.recommendations[0].source_page_url == "https://acme.org"
    assert result.recommendations[1].source_page_url == "https://acme.org/features"
    assert result.outreach_email.word_count == 87
    assert result.outreach_email.word_count < 120


def test_parse_and_validate_ai_response_markdown_blocks():
    inspection = create_sample_inspection()
    raw_json = "```json\n" + create_mock_ai_json(email_body_word_count=70) + "\n```"
    result = parse_and_validate_ai_response(raw_json, inspection)
    assert len(result.recommendations) == 3
    assert result.outreach_email.word_count < 120


def test_parse_and_validate_ai_response_invalid_recommendation_count():
    inspection = create_sample_inspection()
    invalid_data = {
        "recommendations": [
            {
                "title": "Only One",
                "video_type": "Explainer",
                "suggested_placement": "Homepage",
                "rationale": "Reason",
                "evidence": "Evidence",
                "source_page_url": "https://acme.org",
                "target_audience": "All",
                "suggested_outline": "Outline",
            }
        ],
        "outreach_email": {"subject": "Test", "body": "Body", "word_count": 1},
    }
    with pytest.raises(GeminiAnalysisError, match="Expected exactly 3 recommendations"):
        parse_and_validate_ai_response(json.dumps(invalid_data), inspection)


def test_parse_and_validate_ai_response_overlong_email_is_trimmed():
    inspection = create_sample_inspection()
    raw_json = create_mock_ai_json(email_body_word_count=145)
    result = parse_and_validate_ai_response(raw_json, inspection)
    assert result.outreach_email.word_count < 120


def test_generate_ai_analysis_with_mock_client():
    inspection = create_sample_inspection()
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = create_mock_ai_json(email_body_word_count=80)
    mock_client.models.generate_content.return_value = mock_response

    result = generate_ai_analysis(inspection, client=mock_client)
    assert len(result.recommendations) == 3
    assert result.outreach_email.word_count < 120
    assert mock_client.models.generate_content.called


def test_generate_ai_analysis_failed_inspection_short_circuits():
    inspection = create_sample_inspection(status="failed", error_message="DNS Resolution Failed")
    mock_client = MagicMock()
    with pytest.raises(GeminiAnalysisError, match="Cannot perform AI analysis on a failed website inspection"):
        generate_ai_analysis(inspection, client=mock_client)
    assert not mock_client.models.generate_content.called


def test_generate_ai_analysis_rate_limit_error():
    inspection = create_sample_inspection()
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")

    with pytest.raises(GeminiAnalysisError, match="rate limit or quota exceeded"):
        generate_ai_analysis(inspection, client=mock_client, max_retries=0)


def test_generate_ai_analysis_auth_error():
    inspection = create_sample_inspection()
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("401 API_KEY_INVALID: unauthenticated")

    with pytest.raises(GeminiAnalysisError, match="Invalid or unauthorized Gemini API key"):
        generate_ai_analysis(inspection, client=mock_client, max_retries=0)


def test_api_analyze_endpoint_missing_api_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    with patch("app.routes.analysis.inspect_website") as mock_inspect:
        mock_inspect.return_value = create_sample_inspection()
        response = client.post("/api/analyze", json={"url": "https://acme.org"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert "GEMINI_API_KEY is not configured" in data["error_message"]
        assert data["inspection"] is not None


def test_api_analyze_endpoint_failed_inspection():
    with patch("app.routes.analysis.inspect_website") as mock_inspect:
        mock_inspect.return_value = create_sample_inspection(
            status="failed",
            error_message="Host unreachable",
        )
        response = client.post("/api/analyze", json={"url": "https://nonexistent-site.fake"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert "Website inspection failed" in data["error_message"]
        assert len(data["recommendations"]) == 0


def test_api_analyze_endpoint_success():
    inspection = create_sample_inspection()
    mock_ai_result = parse_and_validate_ai_response(create_mock_ai_json(85), inspection)

    with patch("app.routes.analysis.inspect_website", return_value=inspection), \
         patch("app.routes.analysis.generate_ai_analysis", return_value=mock_ai_result):
        response = client.post("/api/analyze", json={"url": "https://acme.org"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["recommendations"]) == 3
        assert data["outreach_email"] is not None
        assert data["outreach_email"]["word_count"] < 120
        assert data["inspection"]["title"] == "Acme Automation - B2B Workflow Platform"
