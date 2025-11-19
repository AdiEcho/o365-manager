from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import Tenant
from app.schemas import (
    O365UserCreate, O365UserUpdate, O365UserResponse, MessageResponse
)
from app.services.msal_service import MSALService
from app.services.graph_service import GraphAPIService

router = APIRouter(prefix="/api/o365/users", tags=["O365 Users"])


async def get_graph_service_by_id(tenant_id: int, db: AsyncSession) -> GraphAPIService:
    """Get GraphAPIService for a specific tenant by ID"""
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


async def get_graph_service(db: AsyncSession = Depends(get_db)) -> GraphAPIService:
    """Legacy function - get first active tenant for backward compatibility"""
    result = await db.execute(
        select(Tenant).where(Tenant.is_active == True).limit(1)
    )
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="No active tenant found. Please add a tenant first."
        )
    
    msal_service = MSALService(
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret=tenant.client_secret
    )
    
    return GraphAPIService(msal_service)


@router.get("", response_model=List[O365UserResponse])
async def list_users(
    top: int = 100,
    filter_query: Optional[str] = None,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        users = await graph_service.get_users(filter_query=filter_query, top=top)
        return [O365UserResponse(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[O365UserResponse])
async def search_users(
    keyword: str,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        users = await graph_service.search_users(keyword)
        return [O365UserResponse(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}", response_model=O365UserResponse)
async def get_user(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        user = await graph_service.get_user(user_id)
        return O365UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=O365UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: O365UserCreate,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        user_payload = {
            "accountEnabled": user_data.account_enabled,
            "displayName": user_data.display_name,
            "mailNickname": user_data.mail_nickname,
            "userPrincipalName": user_data.user_principal_name,
            "passwordProfile": {
                "forceChangePasswordNextSignIn": user_data.force_change_password,
                "password": user_data.password
            },
            "usageLocation": user_data.usage_location
        }
        
        user = await graph_service.create_user(user_payload)
        return O365UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=List[dict])
async def batch_create_users(
    users_data: List[O365UserCreate],
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        users_payload = []
        for user_data in users_data:
            users_payload.append({
                "accountEnabled": user_data.account_enabled,
                "displayName": user_data.display_name,
                "mailNickname": user_data.mail_nickname,
                "userPrincipalName": user_data.user_principal_name,
                "passwordProfile": {
                    "forceChangePasswordNextSignIn": user_data.force_change_password,
                    "password": user_data.password
                },
                "usageLocation": user_data.usage_location
            })
        
        results = await graph_service.batch_create_users(users_payload)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{user_id}", response_model=O365UserResponse)
async def update_user(
    user_id: str,
    user_data: O365UserUpdate,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        update_payload = user_data.model_dump(exclude_unset=True)
        user = await graph_service.update_user(user_id, update_payload)
        return O365UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        await graph_service.delete_user(user_id)
        return MessageResponse(message="User deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/enable", response_model=O365UserResponse)
async def enable_user(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        user = await graph_service.enable_user(user_id)
        return O365UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/disable", response_model=O365UserResponse)
async def disable_user(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        user = await graph_service.disable_user(user_id)
        return O365UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
