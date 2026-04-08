import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, User, Document, Clause
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_db():
    print("Initializing Database with Sample Test Data...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Create Sample Admin User
    admin_email = "admin@lexagent.ai"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        hashed_pw = pwd_context.hash("admin123")
        admin = User(email=admin_email, hashed_password=hashed_pw, role="admin")
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created user: {admin_email}")

    # Create Sample Document
    if not db.query(Document).first():
        doc = Document(
            filename="Sample_Vendor_Agreement.pdf",
            doc_type="MSA",
            extracted_text="This is a sample agreement between Vendor and LexAgent. Liability is uncapped in Section 4.",
            status="needs_approval",
            ai_summary="The AI found one major flaw in Section 4 containing uncapped liability. Recommended for revision.",
            owner_id=admin.id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print("Created sample document.")

        # Create Sample Clauses
        clause1 = Clause(
            document_id=doc.id,
            title="Liability Clause",
            content="Liability is uncapped in Section 4.",
            risk_level="High",
            type="risk",
            ai_action="Redline to cap at $50,000 threshold."
        )
        clause2 = Clause(
            document_id=doc.id,
            title="Termination",
            content="Standard 30 day net termination.",
            risk_level="Low",
            type="info",
            ai_action="Approved."
        )
        db.add(clause1)
        db.add(clause2)
        
        # Add Activity Logs
        from database import ActivityLog
        log1 = ActivityLog(
            event_type="uploaded",
            title="Document Uploaded",
            description=f"'{doc.filename}' was uploaded by system.",
            agent="System",
            document_id=doc.id,
            user_id=admin.id
        )
        log2 = ActivityLog(
            event_type="analyzed",
            title="AI Analysis Complete",
            description=f"'{doc.filename}' analyzed — 2 clauses found.",
            agent="Summarizer Agent",
            document_id=doc.id,
            user_id=admin.id
        )
        db.add(log1)
        db.add(log2)
        
        db.commit()
        print("Created sample clauses and activity logs.")

    print("Seeding Complete!")

if __name__ == "__main__":
    seed_db()
