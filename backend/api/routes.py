from pathlib import Path
import json
from tempfile import NamedTemporaryFile
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.responses import Response

from backend.api.dependencies import get_hybrid_text_checker, get_reporting_service, get_store
from backend.models.schemas import (
    CheckRequest,
    CheckResponse,
    DocumentSummary,
    AnalyzeFileItem,
    AnalyzeFileResponse,
    CompareTextResponse,
    ReportExplanationResponse,
    ReportResponse,
    UploadResponse,
    CompareTextRequest,
    TextPlagiarismCheckRequest,
    TextPlagiarismCheckResponse,
)
from backend.services.preprocessing import Preprocessor
from backend.services.reporting import ReportingService
from backend.services.explanations import build_report_explanation
from backend.utils.config import get_settings
from backend.utils.file_parsers import parse_uploaded_file

router = APIRouter()


async def _store_upload(upload: UploadFile, settings) -> Path:
    suffix = Path(upload.filename or "upload").suffix.lower()
    with NamedTemporaryFile(delete=False, suffix=suffix, dir=settings.upload_dir) as temp_file:
        temp_file.write(await upload.read())
        return Path(temp_file.name)


async def _parse_upload(upload: UploadFile, settings) -> str:
    temp_path = await _store_upload(upload, settings)
    try:
        return parse_uploaded_file(temp_path)
    finally:
        temp_path.unlink(missing_ok=True)


@router.post("/check", response_model=CheckResponse)
def check_text(
    request: CheckRequest,
    checker = Depends(get_hybrid_text_checker),
):
    return checker.run_check(text=request.text)


@router.post("/analyze-text", response_model=CheckResponse)
def analyze_text(
    request: CheckRequest,
    checker = Depends(get_hybrid_text_checker),
):
    return checker.run_check(text=request.text)


@router.get("/report/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    reporting_service: ReportingService = Depends(get_reporting_service),
):
    report = reporting_service.fetch_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "report_id": report["report_id"],
        "similarity_score": report["similarity_score"],
        "classification": report["classification"],
        "highlighted_text": report["highlighted_text"],
        "matched_sources": report["matched_sources"],
        "heatmap": report["heatmap"],
        "created_at": report["created_at"],
        "original_text": report["original_text"],
        "from_cache": False,
    }


@router.get("/report/{report_id}/explain", response_model=ReportExplanationResponse)
def explain_report(
    report_id: str,
    reporting_service: ReportingService = Depends(get_reporting_service),
):
    report = reporting_service.fetch_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    settings = get_settings()
    return build_report_explanation(
        report,
        suspicious_threshold=settings.similarity_threshold_original,
        plagiarized_threshold=settings.similarity_threshold_suspicious,
    )


@router.get("/report/{report_id}/export")
def export_report_json(
    report_id: str,
    reporting_service: ReportingService = Depends(get_reporting_service),
):
    report = reporting_service.fetch_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    settings = get_settings()
    explanation = build_report_explanation(
        report,
        suspicious_threshold=settings.similarity_threshold_original,
        plagiarized_threshold=settings.similarity_threshold_suspicious,
    )

    payload = {
        "report": {
            "report_id": report["report_id"],
            "similarity_score": report["similarity_score"],
            "classification": report["classification"],
            "created_at": report["created_at"],
            "original_text": report["original_text"],
            "highlighted_text": report["highlighted_text"],
            "matched_sources": report["matched_sources"],
            "heatmap": report["heatmap"],
        },
        "explanation": explanation.model_dump(mode="json"),
    }
    filename = f"plagiarism_report_{report_id}.json"
    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/report/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    reporting_service: ReportingService = Depends(get_reporting_service),
):
    path = reporting_service.generate_pdf(report_id)
    if path is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path=str(path), filename=f"plagiarism_report_{report_id}.pdf", media_type="application/pdf")


@router.get("/documents", response_model=list[DocumentSummary])
def list_documents(store=Depends(get_store)):
    return store.list_documents(limit=200)


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    checker = Depends(get_hybrid_text_checker),
):
    settings = get_settings()
    try:
        text = await _parse_upload(file, settings)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}") from exc

    if len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or too short")

    report = checker.run_check(text=text)
    return UploadResponse(filename=file.filename, report=report)


@router.post("/analyze-file", response_model=AnalyzeFileResponse)
async def analyze_file(
    files: list[UploadFile] = File(...),
    checker = Depends(get_hybrid_text_checker),
):
    settings = get_settings()
    items: list[AnalyzeFileItem] = []

    for upload in files:
        try:
            text = await _parse_upload(upload, settings)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not parse {upload.filename}: {exc}") from exc

        if len(text.strip()) < 20:
            raise HTTPException(status_code=400, detail=f"{upload.filename} is empty or too short")

        report = checker.run_check(text=text)
        items.append(AnalyzeFileItem(filename=upload.filename or "untitled", report=report))

    return AnalyzeFileResponse(reports=items)


@router.get("/health")
def health_check():
    return {"status": "ok"}


# ===== Single Text Plagiarism Check Endpoint =====

@router.post("/check-plagiarism-text", response_model=TextPlagiarismCheckResponse)
def check_plagiarism_text(request: TextPlagiarismCheckRequest):
    """
    Check a single text for plagiarism at sentence level.
    
    Combines:
    - FAISS local database semantic search
    - Wikipedia API search
    
    Returns sentence-level plagiarism scores and sources.
    """
    checker = get_hybrid_text_checker()
    
    try:
        result = checker.check_text(
            text=request.text,
            skip_wikipedia=request.skip_wikipedia
        )
        
        return TextPlagiarismCheckResponse(
            plagiarism_percentage=result['plagiarism_percentage'],
            classification=result['classification'],
            total_sentences=result['total_sentences'],
            plagiarized_sentences=result['plagiarized_sentences'],
            sentences=[
                {
                    'text': s['text'],
                    'similarity': s['similarity'],
                    'is_plagiarized': s['is_plagiarized'],
                    'sources': s['sources'],
                    'source_types': s['source_types']
                }
                for s in result['sentences']
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error checking plagiarism: {str(e)}")


@router.post("/compare-text", response_model=CompareTextResponse)
async def compare_text(request: Request, reporting_service: ReportingService = Depends(get_reporting_service)):
    settings = get_settings()

    content_type = request.headers.get("content-type", "")
    text_a: str | None = None
    text_b: str | None = None
    file_a: UploadFile | None = None
    file_b: UploadFile | None = None

    if content_type.startswith("application/json"):
        payload = await request.json()
        text_a = payload.get("text_a")
        text_b = payload.get("text_b")
    else:
        form = await request.form()
        text_a = form.get("text_a")
        text_b = form.get("text_b")
        file_a = form.get("file_a")
        file_b = form.get("file_b")

    if file_a or file_b:
        if not file_a or not file_b:
            raise HTTPException(status_code=400, detail="Both files are required for document comparison")
        text_a = await _parse_upload(file_a, settings)
        text_b = await _parse_upload(file_b, settings)

    if not text_a or not text_b:
        raise HTTPException(status_code=400, detail="Two texts or two files are required for comparison")

    if len(text_a.strip()) < 20 or len(text_b.strip()) < 20:
        raise HTTPException(status_code=400, detail="Both inputs must be at least 20 characters long")

    payload = reporting_service.compare_texts(text_a, text_b)
    return CompareTextResponse(**payload)
