from typing import Optional
from pydantic import BaseModel, Field


class WebsiteInspectRequest(BaseModel):
    url: str = Field(..., description="The public company website URL to inspect")
    max_additional_pages: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum number of relevant same-domain subpages to inspect"
    )


class VideoEvidenceItem(BaseModel):
    detection_type: str
    source_page_url: str
    video_url: Optional[str] = None
    title_or_context: Optional[str] = None
    confidence: str


class PageInspectionResult(BaseModel):
    url: str
    title: Optional[str] = None
    status_code: Optional[int] = None
    status: str
    error_message: Optional[str] = None


class ExtractedHeadings(BaseModel):
    h1: list[str] = Field(default_factory=list)
    h2: list[str] = Field(default_factory=list)
    h3: list[str] = Field(default_factory=list)


class WebsiteInspectResponse(BaseModel):
    requested_url: str
    final_url: Optional[str] = None
    status: str
    title: Optional[str] = None
    meta_description: Optional[str] = None
    factual_summary: Optional[str] = None
    headings: ExtractedHeadings = Field(default_factory=ExtractedHeadings)
    pages_inspected: list[PageInspectionResult] = Field(default_factory=list)
    discovered_relevant_pages: list[str] = Field(default_factory=list)
    video_detection: str
    video_evidence: list[VideoEvidenceItem] = Field(default_factory=list)
    warnings_and_limitations: list[str] = Field(default_factory=list)
    error_message: Optional[str] = None
