from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
import uuid
from app.db.session import Base
from typing import List

# Many-to-Many: UserRoles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False) # Requires Admin Activation
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[str] = mapped_column(String, nullable=True) # TOTP Secret
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    
    roles: Mapped[List["Role"]] = relationship(secondary=user_roles, lazy="selectin")
    
    # Enterprise Admin Control Plane
    profiles: Mapped[List["SystemProfile"]] = relationship("SystemProfile", back_populates="identity", lazy="selectin")

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, index=True) # ADMIN, OPS_ANALYST, etc.
    description: Mapped[str] = mapped_column(String, nullable=True)
    permissions: Mapped[str] = mapped_column(String, nullable=True) # JSON list of permissions e.g. ["READ", "APPROVE"]

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String, index=True) # LOGIN, MFA_FAIL, etc.
    actor_id: Mapped[str] = mapped_column(String, index=True)
    resource: Mapped[str] = mapped_column(String, nullable=True)
    outcome: Mapped[str] = mapped_column(String) # SUCCESS, FAIL
    ip_address: Mapped[str] = mapped_column(String, nullable=True)
    risk_score: Mapped[int] = mapped_column(default=0)
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
