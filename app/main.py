from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
from app.database import init_db
from app.api import auth, tenants, o365_users, licenses, domains, roles, reports
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Office 365 Multi-Tenant Manager",
    description="Async multi-tenant management system for Microsoft 365 using FastAPI and MSAL",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API路由
app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(o365_users.router)
app.include_router(licenses.router)
app.include_router(domains.router)
app.include_router(roles.router)
app.include_router(reports.router)


@app.get("/api")
async def api_root():
    return {
        "message": "Office 365 Multi-Tenant Manager API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# 静态文件服务（前端）
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend for all non-API routes"""
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
            return {"error": "Not found"}
        
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
