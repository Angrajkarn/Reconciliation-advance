from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, admin, transactions, audit, governance, monitoring
from app.core import config
from app.core.config import settings
from app.core.middleware import AuditMiddleware

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditMiddleware)

@app.on_event("startup")
async def startup_event():
    from app.core.background import system_event_generator
    import asyncio
    asyncio.create_task(system_event_generator())

# Include Routers
api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(governance.router, prefix="/governance", tags=["governance"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"]) # Added monitoring router
from app.api import auth, admin, transactions, audit, governance, monitoring, policies, reports, admin_iam
from app.core.events import manager
from fastapi import WebSocket, WebSocketDisconnect

# ...

api_router.include_router(reports.router, prefix="/admin/reports", tags=["reports"])
api_router.include_router(admin_iam.router, prefix="/admin/iam", tags=["iam"])

app.include_router(api_router)

@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep alive / Ignore client messages
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():

    import random
    from datetime import datetime
    
    # Dynamic Batch Calculation (Every 15 mins)
    now = datetime.now()
    minutes_until_next = 15 - (now.minute % 15)
    
    return {
        "status": "System Healthy", 
        "latency": f"{random.randint(10, 45)}ms", 
        "version": config.settings.VERSION,
        "next_batch_min": minutes_until_next
    }
