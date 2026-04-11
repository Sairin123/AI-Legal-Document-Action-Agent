import io
import os
import base64

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract plain text from PDF, DOCX, TXT, or Image files.
    Falls back gracefully if a library is missing.
    """
    name = filename.lower()

    if name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    elif name.endswith(".docx"):
        return _extract_docx(file_bytes)
    elif name.endswith(".jpg") or name.endswith(".jpeg") or name.endswith(".png"):
        return _extract_image(file_bytes, filename)
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

def _extract_image(file_bytes: bytes, filename: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Image extraction requires OPENAI_API_KEY")
        return "[Image upload detected. OCR skipped because OPENAI_API_KEY is not configured.]"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        base64_img = base64.b64encode(file_bytes).decode('utf-8')
        mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
        
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all the raw text from this document image. Return purely the extracted text exactly as it appears, without formatting wrap or explanations."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{base64_img}"}}
                    ]
                }
            ],
            max_tokens=4000
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Vision OCR failed: {e}")
        return "[Image text extraction failed.]"



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
