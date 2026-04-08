import io


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract plain text from PDF, DOCX, or TXT files.
    Falls back gracefully if a library is missing.
    """
    name = filename.lower()

    if name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    elif name.endswith(".docx"):
        return _extract_docx(file_bytes)
    elif name.endswith(".txt"):
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""
    else:
        # Try PDF first, then plain text
        text = _extract_pdf(file_bytes)
        if not text.strip():
            text = file_bytes.decode("utf-8", errors="ignore")
        return text


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    except ImportError:
        pass

    # Fallback: pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        return "\n".join(
            (page.extract_text() or "") for page in reader.pages
        )
    except Exception as e:
        print(f"PDF extraction failed: {e}")
        return ""


def _extract_docx(file_bytes: bytes) -> str:
    try:
        import docx
        document = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in document.paragraphs)
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        return ""


# Keep old name for compatibility
def extract_text_from_pdf(file_bytes: bytes) -> str:
    return _extract_pdf(file_bytes)
