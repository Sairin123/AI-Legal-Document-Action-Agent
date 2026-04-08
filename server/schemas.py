from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ── Auth ────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    email: str
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ── Clauses ─────────────────────────────────────────────────────────────────
class ClauseOut(BaseModel):
    id: int
    title: str
    content: str
    risk_level: str
    type: str
    ai_action: str
    class Config:
        from_attributes = True


# ── Documents ───────────────────────────────────────────────────────────────
class DocumentOut(BaseModel):
    id: int
    filename: str
    doc_type: str
    uploaded_at: datetime
    status: str
    ai_summary: Optional[str] = None
    clauses: List[ClauseOut] = []
    class Config:
        from_attributes = True


# ── Activity Log ─────────────────────────────────────────────────────────────
class ActivityOut(BaseModel):
    id: int
    event_type: str
    title: str
    description: str
    agent: str
    document_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ── Chat ─────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    agent_id: str
    message: str


# ── Action ───────────────────────────────────────────────────────────────────
class ActionRequest(BaseModel):
    action: str   # "approve" | "modify"
