from fastapi import APIRouter
from app.api.v1.endpoints import vinculo, auth, empresas, dashboard, upload, usuarios, configuracoes

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(vinculo.router, prefix="/vinculos", tags=["vinculos"])
api_router.include_router(empresas.router, prefix="/empresas", tags=["empresas"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(configuracoes.router, prefix="/configuracoes", tags=["configuracoes"])
