from typing import Optional
from pydantic import BaseModel, Field

from app.models.inspect import WebsiteInspectResponse


class VideoRecommendationItem(BaseModel):
    title: str = Field(..., description="Clear, specific video idea")
    video_type: str = Field(..., description="Format e.g. Product Explainer, Feature Demo, Customer Story")
    suggested_placement: str = Field(..., description="Page placement e.g. Homepage Hero, Pricing Page")
    rationale: str = Field(..., description="Why this video helps the company based on evidence")
    evidence: str = Field(..., description="Factual references to inspected page copy, headings, or video findings")
    source_page_url: str = Field(..., description="Inspected page URL that supports the recommendation")
    target_audience: str = Field(..., description="Target persona or audience segment")
    suggested_outline: str = Field(..., description="Practical summary of what the video shows")
    evidence_limitations: Optional[str] = Field(default=None, description="Limitations or caveats if applicable")


class OutreachEmailItem(BaseModel):
    subject: str = Field(..., description="Cold outreach subject line")
    body: str = Field(..., description="Email body containing fewer than 120 words")
    word_count: int = Field(..., description="Verified word count of the email body")


class AIAnalysisResult(BaseModel):
    recommendations: list[VideoRecommendationItem] = Field(..., min_length=3, max_length=3)
    outreach_email: OutreachEmailItem


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="Company website URL to inspect and analyze")
    max_additional_pages: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum number of relevant subpages to crawl"
    )


class AnalyzeResponse(BaseModel):
    requested_url: str
    final_url: Optional[str] = None
    status: str
    inspection: Optional[WebsiteInspectResponse] = None
    recommendations: list[VideoRecommendationItem] = Field(default_factory=list)
    outreach_email: Optional[OutreachEmailItem] = None
    warnings_and_limitations: list[str] = Field(default_factory=list)
    error_message: Optional[str] = None
