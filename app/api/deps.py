from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Tenant
from app.services.msal_service import MSALService
from app.services.graph_service import GraphAPIService


async def get_graph_service_by_id(tenant_id: int, db: AsyncSession) -> GraphAPIService:
    """Get GraphAPIService for a specific tenant by database ID"""
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant with ID {tenant_id} not found."
        )

    if not tenant.is_active:
        raise HTTPException(
            status_code=400,
            detail="Tenant is not active."
        )

    msal_service = MSALService(
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret=tenant.client_secret
    )

    return GraphAPIService(msal_service)
