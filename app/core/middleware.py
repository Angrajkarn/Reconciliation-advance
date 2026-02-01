from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import time
from app.db.session import SessionLocal
from app.models.user import AuditLog

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process Request
        response = await call_next(request)
        
        # Cleanup / Logging (Async)
        process_time = time.time() - start_time
        
        # Don't log health checks or static
        if "/health" in request.url.path or request.method == "OPTIONS":
            return response
            
        try:
            # We use a fresh session for logging to avoid async conflicts
            # In production, use a background task
            db = SessionLocal()
            log_entry = AuditLog(
                event_type="API_REQUEST",
                actor_id="anonymous", # TODO: Extract from JWT if available
                resource=request.url.path,
                outcome=str(response.status_code),
                risk_score=0
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception as e:
            print(f"Audit Log Failed: {e}")
            
        return response
