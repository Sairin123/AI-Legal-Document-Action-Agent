"""
LexAgent FastAPI Backend — Full API
====================================
Endpoints:
  POST /auth/signup          — register
  POST /auth/login           — login → JWT
  GET  /auth/me              — current user info (protected)

  POST /api/upload           — upload document (protected)
  POST /api/analyze/{doc_id} — trigger AI analysis (protected)
  GET  /api/queue            — pending-approval documents (protected)
  POST /api/action/{doc_id}  — approve / modify document (protected)
  GET  /api/documents        — all documents for the current user (protected)
  DELETE /api/documents/{id} — delete a document (protected)

  GET  /api/stats            — dashboard stats (protected)
  GET  /api/charts           — chart data for dashboard (protected)
  GET  /api/timeline         — recent activity log (protected)
  POST /api/chat             — chat with an AI agent (protected)
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import os

import database
import schemas
from extraction import extract_text
from agent_manager import analyze_document, chat_with_agent, classify_doc_type
import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-seed database on startup."""
    try:
        from seed_data import seed_db
        seed_db()
    except Exception as e:
        print(f"Seed skipped: {e}")
    yield


# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="LexAgent API", version="2.0.0", lifespan=lifespan)

# Allow all origins — restrict this to your Vercel domain once deployed
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────
def _log(db: Session, title: str, description: str, agent: str,
         event_type: str = "system", document_id: int = None, user_id: int = None):
    entry = database.ActivityLog(
        event_type=event_type,
        title=title,
        description=description,
        agent=agent,
        document_id=document_id,
        user_id=user_id,
    )
    db.add(entry)
    db.commit()


# ── Auth routes (public) ─────────────────────────────────────────────────────
@app.post("/auth/signup", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if db.query(database.User).filter(database.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = database.User(
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter(database.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: database.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/")
def health():
    return {"status": "LexAgent backend running", "version": "2.0.0"}


# ── Document upload & analysis ────────────────────────────────────────────────
@app.post("/api/upload", response_model=schemas.DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    content = await file.read()
    text = extract_text(content, file.filename)
    doc_type = classify_doc_type(text)

    doc = database.Document(
        filename=file.filename,
        doc_type=doc_type,
        extracted_text=text,
        status="pending",
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    _log(db, "Document Uploaded", f"'{file.filename}' received ({doc_type})",
         "System", "uploaded", doc.id, current_user.id)

    return doc


@app.post("/api/analyze/{doc_id}")
async def trigger_analysis(
    doc_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    doc = db.query(database.Document).filter(
        database.Document.id == doc_id,
        database.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    results = analyze_document(doc.extracted_text or "")

    doc.ai_summary = results.get("summary", "")
    doc.status = "needs_approval"

    for c in results.get("clauses", []):
        db.add(database.Clause(
            document_id=doc.id,
            title=c.get("title", ""),
            content=c.get("content", ""),
            risk_level=c.get("riskLevel", "Low"),
            type=c.get("type", "info"),
            ai_action=c.get("aiAction", ""),
        ))

    db.commit()
    db.refresh(doc)

    high_count = sum(1 for c in results.get("clauses", []) if c.get("riskLevel") == "High")
    _log(db,
         "AI Analysis Complete",
         f"'{doc.filename}' analyzed — {len(results.get('clauses', []))} clauses, {high_count} high risk",
         "Summarizer Agent", "analyzed", doc.id, current_user.id)

    return {"status": "success", "doc_id": doc.id, "summary": doc.ai_summary,
            "clauses_found": len(results.get("clauses", []))}


# ── Approval queue ────────────────────────────────────────────────────────────
@app.get("/api/queue")
def get_approval_queue(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    docs = (
        db.query(database.Document)
        .filter(
            database.Document.owner_id == current_user.id,
            database.Document.status == "needs_approval",
        )
        .order_by(database.Document.uploaded_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        # Build content blocks — highlight sentences with risk keywords
        text = doc.extracted_text or ""
        sentences = [s.strip() for s in text.replace("\n", " ").split(". ") if s.strip()]
        risk_words = {"unlimited", "unrestricted", "indemnif", "non-compete", "perpetual", "irrevocable"}
        blocks = []
        for s in sentences[:30]:  # first 30 sentences
            lower = s.lower()
            match = next((w for w in risk_words if w in lower), None)
            blocks.append({
                "p": s + ".",
                "highlight": "danger" if match else None,
                "reason": f"Contains '{match}' — review carefully" if match else None,
            })

        result.append({
            "id": doc.id,
            "name": doc.filename,
            "doc_type": doc.doc_type,
            "time": doc.uploaded_at.strftime("%b %d, %Y %H:%M"),
            "aiSummary": doc.ai_summary or "Analysis pending",
            "content": blocks if blocks else [{"p": "No text extracted.", "highlight": None}],
            "clauses": [
                {
                    "title": c.title,
                    "riskLevel": c.risk_level,
                    "type": c.type,
                    "content": c.content,
                    "aiAction": c.ai_action,
                }
                for c in doc.clauses
            ],
        })
    return result


# ── Register approval action ─────────────────────────────────────────────────
@app.post("/api/action/{doc_id}")
def register_action(
    doc_id: int,
    body: schemas.ActionRequest,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    doc = db.query(database.Document).filter(
        database.Document.id == doc_id,
        database.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    is_approve = body.action == "approve"
    doc.status = "approved" if is_approve else "modified"
    db.commit()

    _log(db,
         "Document Approved" if is_approve else "Sent for Modification",
         f"'{doc.filename}' {'approved by' if is_approve else 'flagged for modification by'} {current_user.email}",
         "Action Agent",
         "approved" if is_approve else "modified",
         doc.id, current_user.id)

    return {"success": True, "status": doc.status}


# ── All documents for current user ────────────────────────────────────────────
@app.get("/api/documents", response_model=List[schemas.DocumentOut])
def list_documents(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    return (
        db.query(database.Document)
        .filter(database.Document.owner_id == current_user.id)
        .order_by(database.Document.uploaded_at.desc())
        .all()
    )


@app.delete("/api/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    doc = db.query(database.Document).filter(
        database.Document.id == doc_id,
        database.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()


# ── Dashboard stats ───────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    total = db.query(database.Document).filter(database.Document.owner_id == current_user.id).count()
    approved = db.query(database.Document).filter(
        database.Document.owner_id == current_user.id,
        database.Document.status == "approved",
    ).count()
    pending = db.query(database.Document).filter(
        database.Document.owner_id == current_user.id,
        database.Document.status == "needs_approval",
    ).count()
    high_risk = (
        db.query(database.Clause)
        .join(database.Document)
        .filter(
            database.Document.owner_id == current_user.id,
            database.Clause.risk_level == "High",
        )
        .count()
    )
    return {
        "processed": total,
        "actions_pending": pending,
        "high_risk_clauses": high_risk,
        "automation_rate": f"{(approved / total * 100):.0f}%" if total > 0 else "0%",
    }


# ── Chart data ────────────────────────────────────────────────────────────────
@app.get("/api/charts")
def get_chart_data(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    from collections import Counter
    from sqlalchemy import func

    docs = db.query(database.Document).filter(database.Document.owner_id == current_user.id).all()

    # Pie chart: doc type distribution
    type_counts = Counter(d.doc_type for d in docs)
    color_map = {
        "NDA": "#5BC0BE",
        "MSA": "#3A506B",
        "Employment": "#6FFFE9",
        "Lease": "#1C2541",
        "Other": "#0B132B",
    }
    classification = [
        {"name": k, "value": v, "color": color_map.get(k, "#888")}
        for k, v in type_counts.items()
    ] or [{"name": "No Data", "value": 1, "color": "#334155"}]

    # Risk bar chart: per status
    clauses = (
        db.query(database.Clause)
        .join(database.Document)
        .filter(database.Document.owner_id == current_user.id)
        .all()
    )
    risk_counter = Counter(c.risk_level for c in clauses)
    risk_bar = [
        {
            "name": "All Docs",
            "high": risk_counter.get("High", 0),
            "medium": risk_counter.get("Medium", 0),
            "low": risk_counter.get("Low", 0),
        }
    ]

    # Line chart: document uploads per week (last 5 weeks)
    now = datetime.utcnow()
    weekly = []
    for i in range(4, -1, -1):
        start = now - timedelta(weeks=i + 1)
        end = now - timedelta(weeks=i)
        count = sum(1 for d in docs if start <= d.uploaded_at < end)
        weekly.append({"name": f"W{5-i}", "docs": count})

    return {
        "classification": classification,
        "risk_distribution": risk_bar,
        "weekly_volume": weekly,
    }


# ── Timeline / activity feed ──────────────────────────────────────────────────
@app.get("/api/timeline")
def get_timeline(
    limit: int = 20,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    logs = (
        db.query(database.ActivityLog)
        .filter(database.ActivityLog.user_id == current_user.id)
        .order_by(database.ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    now = datetime.utcnow()

    def _rel_time(dt: datetime) -> str:
        diff = now - dt
        s = int(diff.total_seconds())
        if s < 60:
            return "just now"
        elif s < 3600:
            return f"{s // 60} min ago"
        elif s < 86400:
            return f"{s // 3600} hr ago"
        else:
            return f"{s // 86400} day{'s' if s // 86400 > 1 else ''} ago"

    return [
        {
            "id": log.id,
            "event_type": log.event_type,
            "title": log.title,
            "description": log.description,
            "agent": log.agent,
            "document_id": log.document_id,
            "time": _rel_time(log.created_at),
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


# ── Chat with agent ───────────────────────────────────────────────────────────
@app.post("/api/chat")
def chat_endpoint(
    req: schemas.ChatRequest,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user),
):
    response_text = chat_with_agent(req.agent_id, req.message)

    _log(db,
         f"{req.agent_id.title()} Agent Chat",
         f"User asked: \"{req.message[:80]}{'...' if len(req.message) > 80 else ''}\"",
         f"{req.agent_id.title()} Agent",
         "chat", None, current_user.id)

    return {"response": response_text}
