from fastapi import APIRouter
from app.models.inspect import WebsiteInspectRequest, WebsiteInspectResponse
from app.services.website_reader import inspect_website

router = APIRouter(prefix="/api", tags=["Website Inspection"])


@router.post(
    "/website/inspect",
    response_model=WebsiteInspectResponse,
    summary="Inspect a company website for text, structure, and video evidence",
)
@router.post(
    "/inspect",
    response_model=WebsiteInspectResponse,
    include_in_schema=False,
)
def inspect_website_endpoint(request: WebsiteInspectRequest) -> WebsiteInspectResponse:
    return inspect_website(
        target_url=request.url,
        max_additional_pages=request.max_additional_pages,
    )
