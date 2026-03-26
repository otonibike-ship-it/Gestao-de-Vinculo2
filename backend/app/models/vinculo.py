from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Numeric, Date, Boolean
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class StatusVinculo(str, enum.Enum):
    aberto = "aberto"
    validacao_financeiro = "validacao_financeiro"
    tarefa_ti = "tarefa_ti"
    fechado = "fechado"


class Vinculo(Base):
    __tablename__ = "vinculos"

    id = Column(Integer, primary_key=True, index=True)
    numero_pedido = Column(String(50), unique=True, nullable=False, index=True)
    franquia_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    nome_cliente = Column(String(300), nullable=False)
    valor_pedido = Column(Numeric(12, 2), nullable=False)
    data_pedido = Column(Date, nullable=False)
    motivo = Column(String(500), nullable=True)
    necessario_validacao = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(StatusVinculo), default=StatusVinculo.aberto, nullable=False)
    anexos = Column(JSON, default=list)
    justificativa_reprovacao = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
