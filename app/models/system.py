from sqlalchemy import Column, String, Boolean, ForeignKey, Table, Enum
from sqlalchemy.orm import Relationship, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base
from datetime import datetime

class System(Base):
    __tablename__ = "systems"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, index=True) # RECON, RISK, LEDGER
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ACTIVE") # ACTIVE, MAINTENANCE
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    profiles: Mapped[list["SystemProfile"]] = relationship(back_populates="system")

class SystemProfile(Base):
    __tablename__ = "system_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Links
    identity_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    system_id: Mapped[str] = mapped_column(ForeignKey("systems.id"), nullable=False)
    
    # Profile Details
    username: Mapped[str] = mapped_column(String) # System specific username, e.g. "karn.deo.recon"
    role: Mapped[str] = mapped_column(String) # ADMIN, OPERATOR, VIEWER
    status: Mapped[str] = mapped_column(String, default="ACTIVE") # ACTIVE, DISABLED, LOCKED
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    last_access: Mapped[datetime] = mapped_column(nullable=True)
    
    # Relationships
    system: Mapped["System"] = relationship(back_populates="profiles")
    identity: Mapped["User"] = relationship("User", back_populates="profiles")
