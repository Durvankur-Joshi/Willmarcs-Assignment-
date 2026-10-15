from fastapi import APIRouter
from app.models.analysis import AnalyzeRequest, AnalyzeResponse
from app.services.ai_analyzer import (
    GeminiAnalysisError,
    GeminiConfigError,
    generate_ai_analysis,
)
from app.services.website_reader import inspect_website

router = APIRouter(prefix="/api", tags=["AI Video Opportunity Analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Inspect website and generate AI-driven video recommendations and cold outreach email",
)
@router.post(
    "/analysis",
    response_model=AnalyzeResponse,
    include_in_schema=False,
)
def analyze_website_endpoint(request: AnalyzeRequest) -> AnalyzeResponse:
    inspection = inspect_website(
        target_url=request.url,
        max_additional_pages=request.max_additional_pages,
    )

    if inspection.status == "failed":
        return AnalyzeResponse(
            requested_url=request.url,
            final_url=None,
            status="failed",
            inspection=inspection,
            recommendations=[],
            outreach_email=None,
            warnings_and_limitations=inspection.warnings_and_limitations,
            error_message=f"Website inspection failed: {inspection.error_message or 'Target site could not be accessed'}",
        )

    try:
        ai_result = generate_ai_analysis(inspection)
    except GeminiConfigError as exc:
        return AnalyzeResponse(
            requested_url=request.url,
            final_url=inspection.final_url,
            status="failed",
            inspection=inspection,
            recommendations=[],
            outreach_email=None,
            warnings_and_limitations=inspection.warnings_and_limitations,
            error_message=str(exc),
        )
    except GeminiAnalysisError as exc:
        return AnalyzeResponse(
            requested_url=request.url,
            final_url=inspection.final_url,
            status="failed",
            inspection=inspection,
            recommendations=[],
            outreach_email=None,
            warnings_and_limitations=inspection.warnings_and_limitations,
            error_message=str(exc),
        )

    warnings = list(inspection.warnings_and_limitations)
    if inspection.status == "partial_success":
        warnings.append("AI recommendations were generated based on partial website evidence due to subpage crawl limitations.")

    return AnalyzeResponse(
        requested_url=request.url,
        final_url=inspection.final_url,
        status=inspection.status,
        inspection=inspection,
        recommendations=ai_result.recommendations,
        outreach_email=ai_result.outreach_email,
        warnings_and_limitations=warnings,
        error_message=None,
    )
