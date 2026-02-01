from sqlalchemy import String, Boolean, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

class RLPolicy(Base):
    __tablename__ = "rl_policies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    version: Mapped[str] = mapped_column(String, unique=True, index=True) # e.g. "v1.0.0-shadow"
    description: Mapped[str] = mapped_column(String, nullable=True)
    
    # Lifecycle Status
    status: Mapped[str] = mapped_column(String, default="TRAINING") # TRAINING, SHADOW, ACTIVE, ARCHIVED
    
    # Configuration (JSON for flexibility)
    reward_config: Mapped[dict] = mapped_column(JSON, nullable=False) # e.g. {"override_penalty": 10, "risk_penalty": 50}
    constraints: Mapped[dict] = mapped_column(JSON, nullable=False) # e.g. {"max_auto_amount": 10000}
    
    # Metadata
    created_by: Mapped[str] = mapped_column(String) # Admin Identity ID
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    activated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
