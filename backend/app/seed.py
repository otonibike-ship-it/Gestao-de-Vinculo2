"""
Seed — dados iniciais para desenvolvimento local
Execute: docker compose exec api python -m app.seed
"""
import asyncio
from datetime import date
from decimal import Decimal
from app.core.database import AsyncSessionLocal
from app.models.usuario import Usuario, PerfilUsuario
from app.models.pessoa import Empresa
from app.models.vinculo import Vinculo, StatusVinculo
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    async with AsyncSessionLocal() as db:
        # Usuários por perfil
        usuarios = [
            Usuario(
                nome="Admin", email="admin@vinculo.com",
                senha_hash=pwd_context.hash("admin123"),
                perfil=PerfilUsuario.admin, ativo=True,
            ),
            Usuario(
                nome="Equipe Comercial", email="comercial@vinculo.com",
                senha_hash=pwd_context.hash("123456"),
                perfil=PerfilUsuario.comercial, ativo=True,
            ),
            Usuario(
                nome="Equipe Financeiro", email="financeiro@vinculo.com",
                senha_hash=pwd_context.hash("123456"),
                perfil=PerfilUsuario.financeiro, ativo=True,
            ),
            Usuario(
                nome="Equipe TI", email="ti@vinculo.com",
                senha_hash=pwd_context.hash("123456"),
                perfil=PerfilUsuario.ti, ativo=True,
            ),
        ]
        db.add_all(usuarios)

        # Franquias (Empresas)
        franquia1 = Empresa(
            razao_social="SenseBike Matriz Ltda",
            cnpj="12.345.678/0001-90",
            nome_fantasia="SenseBike Matriz",
            email="contato@sensebike.com.br",
        )
        franquia2 = Empresa(
            razao_social="SenseBike Filial SP",
            cnpj="98.765.432/0001-10",
            nome_fantasia="SenseBike SP",
            email="sp@sensebike.com.br",
        )
        franquia3 = Empresa(
            razao_social="SenseBike Filial RJ",
            cnpj="11.222.333/0001-44",
            nome_fantasia="SenseBike RJ",
            email="rj@sensebike.com.br",
        )
        db.add_all([franquia1, franquia2, franquia3])
        await db.flush()

        # Vínculos de teste em diferentes status
        db.add_all([
            Vinculo(
                numero_pedido="PED-001",
                franquia_id=franquia1.id,
                nome_cliente="João Silva",
                valor_pedido=Decimal("1500.00"),
                data_pedido=date(2026, 3, 10),
                necessario_validacao=True,
                status=StatusVinculo.validacao_financeiro,
                anexos=[],
            ),
            Vinculo(
                numero_pedido="PED-002",
                franquia_id=franquia2.id,
                nome_cliente="Maria Santos",
                valor_pedido=Decimal("3200.50"),
                data_pedido=date(2026, 3, 12),
                necessario_validacao=False,
                status=StatusVinculo.tarefa_ti,
                anexos=[],
            ),
            Vinculo(
                numero_pedido="PED-003",
                franquia_id=franquia1.id,
                nome_cliente="Pedro Costa",
                valor_pedido=Decimal("850.00"),
                data_pedido=date(2026, 3, 14),
                necessario_validacao=True,
                status=StatusVinculo.fechado,
                anexos=[],
            ),
            Vinculo(
                numero_pedido="PED-004",
                franquia_id=franquia3.id,
                nome_cliente="Ana Oliveira",
                valor_pedido=Decimal("2100.00"),
                data_pedido=date(2026, 3, 15),
                necessario_validacao=False,
                status=StatusVinculo.aberto,
                anexos=[],
                justificativa_reprovacao="Dados do cliente incompletos - TI",
            ),
            Vinculo(
                numero_pedido="PED-005",
                franquia_id=franquia2.id,
                nome_cliente="Carlos Mendes",
                valor_pedido=Decimal("4500.00"),
                data_pedido=date(2026, 3, 16),
                necessario_validacao=True,
                status=StatusVinculo.validacao_financeiro,
                anexos=[],
            ),
        ])

        await db.commit()
        print("✅ Seed concluído!")
        print("")
        print("Usuários de teste:")
        print("  comercial@vinculo.com  / 123456    (Comercial)")
        print("  financeiro@vinculo.com / 123456    (Financeiro)")
        print("  ti@vinculo.com         / 123456    (TI)")
        print("  admin@vinculo.com      / admin123  (Admin)")


if __name__ == "__main__":
    asyncio.run(seed())
