import re


def split_clauses(text: str):
    """
    Advanced clause splitter for legal documents
    """

    # 🔹 Step 1: Normalize text
    text = text.replace("\r", " ")
    text = text.replace("\n", " ")
    text = re.sub(r'\s+', ' ', text).strip()

    # 🔹 Step 2: Split using multiple legal patterns
    clauses = re.split(
        r'''
        (?:
            (?<=\.)\s+ |                # sentence end
            (?<=;)\s+ |                # semicolon
            \b\d+\.\s+ |               # 1. 2. 3.
            \b\d+\.\d+\s+ |            # 1.1 1.2
            \(\w\)\s+ |                # (a) (b)
            \bWHEREAS\b |              # legal keyword
            \bProvided that\b |
            \bNotwithstanding\b
        )
        ''',
        text,
        flags=re.IGNORECASE | re.VERBOSE
    )

    # 🔹 Step 3: Clean + filter
    cleaned_clauses = []

    for clause in clauses:
        clause = clause.strip()

        # Remove very short / noisy clauses
        if len(clause) < 25:
            continue

        # Remove clauses with only numbers/symbols
        if re.fullmatch(r'[\d\W]+', clause):
            continue

        cleaned_clauses.append(clause)

    return cleaned_clauses