import os
from PyPDF2 import PdfReader
from docx import Document


def extract_text(file) -> str:
    """
    Extract text from PDF, DOCX, or TXT file
    """
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return extract_pdf(file)

    elif filename.endswith(".docx"):
        return extract_docx(file)

    elif filename.endswith(".txt"):
        return extract_txt(file)

    else:
        raise ValueError("Unsupported file format. Use PDF, DOCX, or TXT.")


# 🔹 PDF Reader
def extract_pdf(file) -> str:
    reader = PdfReader(file.file)
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    return text


# 🔹 DOCX Reader
def extract_docx(file) -> str:
    doc = Document(file.file)
    text = ""

    for para in doc.paragraphs:
        text += para.text + "\n"

    return text


# 🔹 TXT Reader (NEW)
def extract_txt(file) -> str:
    content = file.file.read()

    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")