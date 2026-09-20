from pathlib import Path
from typing import Any
from app.routers import admin_auth
from fastapi import Depends, FastAPI
from app.routers import admin_problem_selection
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.routers import admin
from app.routers import admin_evaluators
from app.routers import admin_evaluations
from app.routers import admin_problems
from app.routers import admin_reports
from app.routers import admin_rounds
from app.routers import admin_teams
from app.routers import leaderboard


from app.database import get_db
from app.routers import (
    auth,
    evaluator,
    evaluator_auth,
    problems,
    repository_feedback,
    rounds,
    teams,
)


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOADS_DIR = BASE_DIR / "uploads"

UPLOADS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ---------------------------------------------------------
# APP
# ---------------------------------------------------------

app = FastAPI(
    title="HackOddsey API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# STATIC FILES
# ---------------------------------------------------------

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads",
)


# ---------------------------------------------------------
# ROUTERS
# ---------------------------------------------------------

app.include_router(auth.router)
app.include_router(evaluator_auth.router)
app.include_router(evaluator.router)
app.include_router(problems.router)
app.include_router(rounds.router)
app.include_router(teams.router)
app.include_router(admin_auth.router)
app.include_router(admin.router)
app.include_router(admin_evaluators.router)
app.include_router(admin_evaluations.router)
app.include_router(admin_problems.router)
app.include_router(admin_reports.router)
app.include_router(admin_rounds.router)
app.include_router(admin_teams.router)
app.include_router(leaderboard.router)
app.include_router(repository_feedback.router)
app.include_router(admin_problem_selection.router)


from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from app.services.problem_release import problem_release_manager

@app.websocket("/ws/problems/release")
async def ws_problems_release(
    websocket: WebSocket,
    db: Session = Depends(get_db),
):
    await problem_release_manager.connect(websocket)
    try:
        from app.routers.problems import _get_or_create_event_settings
        event_setting = _get_or_create_event_settings(db)
        now = datetime.now(timezone.utc)
        await websocket.send_json({
            "type": "release_update",
            "status": event_setting.problem_release_status,
            "release_at": (
                event_setting.problem_release_at.isoformat()
                if event_setting.problem_release_at
                else None
            ),
            "server_time": now.isoformat(),
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        problem_release_manager.disconnect(websocket)

# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "HackOddsey backend is running",
    }


# ---------------------------------------------------------
# DATABASE HEALTH CHECK
# ---------------------------------------------------------

@app.get("/health/db")
def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    result = db.execute(
        text("SELECT 1")
    )

    return {
        "status": "ok",
        "database": "connected",
        "result": result.scalar(),
    }