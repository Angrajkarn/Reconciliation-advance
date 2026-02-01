from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

class ForensicLedger(Base):
    __tablename__ = "forensic_ledger"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    txn_id: Mapped[str] = mapped_column(String, index=True) # Link to Transaction
    
    # Forensic Fields
    event_type: Mapped[str] = mapped_column(String) # INGESTION, NORMALIZATION, ML_SCORING, OPS_REVIEW, DECISION
    stage: Mapped[str] = mapped_column(String) # Layer 1, 2, 3
    actor: Mapped[str] = mapped_column(String) # System Component or User
    
    # Immutable Evidence
    payload_hash: Mapped[str] = mapped_column(String) # SHA256 of the payload
    previous_hash: Mapped[str] = mapped_column(String, nullable=True) # Chain link
    
    # Full Data Snapshot (Stored as JSON string for SQLite/MVP simplicity)
    metadata_json: Mapped[str] = mapped_column(Text, nullable=True) 
    
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
