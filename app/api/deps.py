import logging

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


def raise_graph_api_error(error: Exception, context: str = ""):
    """Standardized error handler for Graph API errors with Chinese messages"""
    error_msg = str(error)
    prefix = f"{context}: " if context else ""

    if "Insufficient privileges" in error_msg or "Access is denied" in error_msg:
        raise HTTPException(status_code=403, detail=f"{prefix}权限不足，请确保应用已授予所需权限并完成管理员同意。")
    elif "Invalid client secret" in error_msg or "AADSTS7000215" in error_msg:
        raise HTTPException(status_code=401, detail=f"{prefix}身份验证失败，客户端密钥无效或已过期。")
    elif "AADSTS700016" in error_msg:
        raise HTTPException(status_code=401, detail=f"{prefix}应用程序 ID 不存在或未注册。")
    elif "AADSTS90002" in error_msg:
        raise HTTPException(status_code=404, detail=f"{prefix}租户 ID 无效或不存在。")
    elif "timed out" in error_msg.lower() or "timeout" in error_msg.lower():
        raise HTTPException(status_code=504, detail=f"{prefix}请求超时，请稍后重试。")
    elif "Connection" in error_msg or "Network" in error_msg:
        raise HTTPException(status_code=503, detail=f"{prefix}无法连接到 Microsoft Graph API，请检查网络。")
    else:
        raise HTTPException(status_code=500, detail=f"{prefix}操作失败: {error_msg}")
