from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.pessoa import Empresa
from app.schemas.pessoa import EmpresaCreate, EmpresaResponse

router = APIRouter()


@router.get("", response_model=List[EmpresaResponse])
async def listar_empresas(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def obter_empresa(empresa_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = result.scalar_one_or_none()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return empresa


@router.post("", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def criar_empresa(payload: EmpresaCreate, db: AsyncSession = Depends(get_db)):
    empresa = Empresa(**payload.model_dump())
    db.add(empresa)
    await db.flush()
    await db.refresh(empresa)
    return empresa


@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remover_empresa(empresa_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = result.scalar_one_or_none()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    await db.delete(empresa)
