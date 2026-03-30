from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.models.vinculo import Vinculo, StatusVinculo
from app.models.pessoa import Empresa
from app.schemas.vinculo import VinculoCreate, VinculoResponse, AprovarRequest, ReprovarRequest, ReenviarRequest

router = APIRouter()


async def _enrich(v: Vinculo, db: AsyncSession) -> dict:
    empresa_result = await db.execute(select(Empresa).where(Empresa.id == v.franquia_id))
    empresa = empresa_result.scalar_one_or_none()
    return {
        "id": v.id,
        "numero_pedido": v.numero_pedido,
        "franquia_id": v.franquia_id,
        "franquia_nome": empresa.nome_fantasia or empresa.razao_social if empresa else "—",
        "nome_cliente": v.nome_cliente,
        "valor_pedido": v.valor_pedido,
        "data_pedido": v.data_pedido.isoformat() if v.data_pedido else None,
        "motivo": v.motivo,
        "necessario_validacao": v.necessario_validacao,
        "status": v.status.value if v.status else None,
        "anexos": v.anexos or [],
        "justificativa_reprovacao": v.justificativa_reprovacao,
        "criado_em": v.criado_em.isoformat() if v.criado_em else None,
        "atualizado_em": v.atualizado_em.isoformat() if v.atualizado_em else None,
    }


@router.get("")
async def listar_vinculos(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    query = select(Vinculo)
    if status_filter:
        query = query.where(Vinculo.status == status_filter)
    query = query.order_by(Vinculo.criado_em.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    vinculos = result.scalars().all()
    return [await _enrich(v, db) for v in vinculos]


@router.get("/{vinculo_id}")
async def obter_vinculo(vinculo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    vinculo = result.scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    return await _enrich(vinculo, db)


@router.post("", status_code=status.HTTP_201_CREATED)
async def criar_vinculo(payload: VinculoCreate, db: AsyncSession = Depends(get_db)):
    # Definir status baseado em necessario_validacao
    if payload.necessario_validacao:
        status_inicial = StatusVinculo.validacao_financeiro
    else:
        status_inicial = StatusVinculo.tarefa_ti

    vinculo = Vinculo(
        numero_pedido=payload.numero_pedido,
        franquia_id=payload.franquia_id,
        nome_cliente=payload.nome_cliente,
        valor_pedido=payload.valor_pedido,
        data_pedido=payload.data_pedido,
        motivo=payload.motivo,
        necessario_validacao=payload.necessario_validacao,
        status=status_inicial,
        anexos=payload.anexos,
    )
    db.add(vinculo)
    await db.flush()
    await db.refresh(vinculo)
    return await _enrich(vinculo, db)


@router.put("/{vinculo_id}/aprovar")
async def aprovar_vinculo(vinculo_id: int, payload: AprovarRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    vinculo = result.scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    if vinculo.status == StatusVinculo.validacao_financeiro:
        vinculo.status = StatusVinculo.tarefa_ti
        if payload.anexos:
            anexos_atuais = vinculo.anexos or []
            vinculo.anexos = anexos_atuais + payload.anexos
    elif vinculo.status == StatusVinculo.tarefa_ti:
        vinculo.status = StatusVinculo.fechado
    else:
        raise HTTPException(status_code=400, detail=f"Não é possível aprovar vínculo com status '{vinculo.status.value}'")

    vinculo.justificativa_reprovacao = None
    await db.flush()
    await db.refresh(vinculo)
    return await _enrich(vinculo, db)


@router.put("/{vinculo_id}/reenviar")
async def reenviar_vinculo(vinculo_id: int, payload: ReenviarRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    vinculo = result.scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    if vinculo.status != StatusVinculo.aberto:
        raise HTTPException(status_code=400, detail="Só é possível reenviar pedidos com status 'aberto'")

    vinculo.franquia_id = payload.franquia_id
    vinculo.nome_cliente = payload.nome_cliente
    vinculo.valor_pedido = payload.valor_pedido
    vinculo.data_pedido = payload.data_pedido
    vinculo.motivo = payload.motivo
    vinculo.necessario_validacao = payload.necessario_validacao
    vinculo.anexos = payload.anexos
    vinculo.justificativa_reprovacao = None

    if payload.necessario_validacao:
        vinculo.status = StatusVinculo.validacao_financeiro
    else:
        vinculo.status = StatusVinculo.tarefa_ti

    await db.flush()
    await db.refresh(vinculo)
    return await _enrich(vinculo, db)


@router.put("/{vinculo_id}/reprovar")
async def reprovar_vinculo(vinculo_id: int, payload: ReprovarRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    vinculo = result.scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    if vinculo.status not in (StatusVinculo.validacao_financeiro, StatusVinculo.tarefa_ti):
        raise HTTPException(status_code=400, detail=f"Não é possível reprovar vínculo com status '{vinculo.status.value}'")

    vinculo.status = StatusVinculo.aberto
    vinculo.justificativa_reprovacao = payload.justificativa
    await db.flush()
    await db.refresh(vinculo)
    return await _enrich(vinculo, db)


@router.delete("/{vinculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_vinculo(vinculo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    vinculo = result.scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vinculo nao encontrado")
    await db.delete(vinculo)
    await db.flush()
