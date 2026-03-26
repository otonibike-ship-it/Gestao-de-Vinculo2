from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class StatusVinculo(str, Enum):
    aberto = "aberto"
    validacao_financeiro = "validacao_financeiro"
    tarefa_ti = "tarefa_ti"
    fechado = "fechado"


class VinculoCreate(BaseModel):
    numero_pedido: str
    franquia_id: int
    nome_cliente: str
    valor_pedido: Decimal
    data_pedido: date
    motivo: Optional[str] = None
    necessario_validacao: bool = False
    anexos: list[str] = []


class VinculoResponse(BaseModel):
    id: int
    numero_pedido: str
    franquia_id: int
    franquia_nome: Optional[str] = None
    nome_cliente: str
    valor_pedido: Decimal
    data_pedido: date
    motivo: Optional[str] = None
    necessario_validacao: bool
    status: StatusVinculo
    anexos: list[str] = []
    justificativa_reprovacao: Optional[str] = None
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class AprovarRequest(BaseModel):
    anexos: list[str] = []


class ReprovarRequest(BaseModel):
    justificativa: str


class ReenviarRequest(BaseModel):
    franquia_id: int
    nome_cliente: str
    valor_pedido: Decimal
    data_pedido: date
    motivo: Optional[str] = None
    necessario_validacao: bool = False
    anexos: list[str] = []
