from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    doc_type = Column(String, default="Other")          # NDA, MSA, Employment, Lease, Other
    extracted_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")           # pending, needs_approval, approved, modified
    ai_summary = Column(Text, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="documents")
    clauses = relationship("Clause", back_populates="document", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    title = Column(String)
    content = Column(Text)
    risk_level = Column(String)   # High, Medium, Low
    type = Column(String)         # risk, warning, info
    ai_action = Column(Text)

    document = relationship("Document", back_populates="clauses")


class ActivityLog(Base):
    """Tracks every meaningful agent/user action for the Timeline feed."""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)       # uploaded, analyzed, approved, modified, chat
    title = Column(String)
    description = Column(Text)
    agent = Column(String)            # Summarizer, Risk Analyzer, Action Agent, System
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
