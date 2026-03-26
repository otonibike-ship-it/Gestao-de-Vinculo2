from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.vinculo import Vinculo, StatusVinculo

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(Vinculo.id)))
    abertos = await db.execute(select(func.count(Vinculo.id)).where(Vinculo.status == StatusVinculo.aberto))
    financeiro = await db.execute(select(func.count(Vinculo.id)).where(Vinculo.status == StatusVinculo.validacao_financeiro))
    ti = await db.execute(select(func.count(Vinculo.id)).where(Vinculo.status == StatusVinculo.tarefa_ti))
    fechados = await db.execute(select(func.count(Vinculo.id)).where(Vinculo.status == StatusVinculo.fechado))

    return {
        "total": total.scalar() or 0,
        "abertos": abertos.scalar() or 0,
        "validacao_financeiro": financeiro.scalar() or 0,
        "tarefa_ti": ti.scalar() or 0,
        "fechados": fechados.scalar() or 0,
    }
