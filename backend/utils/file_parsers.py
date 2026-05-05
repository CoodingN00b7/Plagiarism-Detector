from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from xml.etree import ElementTree as ET

from PyPDF2 import PdfReader


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_pdf_file(path: Path) -> str:
    reader = PdfReader(str(path), strict=False)
    pages: list[str] = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(pages)


def read_docx_file(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        document_xml = archive.read("word/document.xml")
    root = ET.fromstring(document_xml)
    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    texts = [node.text for node in root.iter(f"{namespace}t") if node.text]
    return "\n".join(texts)


def read_doc_file(path: Path) -> str:
    antiword = shutil.which("antiword")
    if antiword:
        result = subprocess.run([antiword, str(path)], capture_output=True, text=True, check=True)
        return result.stdout

    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice:
        with tempfile.TemporaryDirectory() as temp_dir:
          subprocess.run([soffice, "--headless", "--convert-to", "txt:Text", "--outdir", temp_dir, str(path)], capture_output=True, text=True, check=True)
          converted = Path(temp_dir) / f"{path.stem}.txt"
          if converted.exists():
              return converted.read_text(encoding="utf-8", errors="ignore")

    raise ValueError("Unsupported .doc file on this system. Install antiword or LibreOffice for DOC parsing.")


def parse_uploaded_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return read_text_file(path)
    if suffix == ".pdf":
        return read_pdf_file(path)
    if suffix == ".docx":
        return read_docx_file(path)
    if suffix == ".doc":
        return read_doc_file(path)
    raise ValueError("Unsupported file type. Supported: .pdf, .txt, .docx, .doc")
