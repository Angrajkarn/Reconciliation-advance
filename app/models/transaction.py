from sqlalchemy import String, Float, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"TXN-{uuid.uuid4().hex[:8].upper()}")
    source: Mapped[str] = mapped_column(String, index=True) # SWIFT, LEDGER
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String, default="USD")
    
    # Recon Status
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, MATCHED, EXCEPTION, OPS_REVIEW
    match_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    
    # Metadata
    counterparty: Mapped[str] = mapped_column(String, nullable=True)
    value_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
