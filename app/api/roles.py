from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import O365RoleAssignment, MessageResponse
from app.services.graph_service import GraphAPIService
from app.api.o365_users import get_graph_service, get_graph_service_by_id
from app.auth import get_current_user

router = APIRouter(prefix="/api/o365/roles", tags=["O365 Roles"])

GLOBAL_ADMIN_ROLE_ID = "62e90394-69f5-4237-9190-012177145e10"


@router.get("")
async def list_directory_roles(
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        roles = await graph_service.get_directory_roles()
        return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant/{tenant_id}")
async def list_directory_roles_by_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        graph_service = await get_graph_service_by_id(tenant_id, db)
        roles = await graph_service.get_directory_roles()
        return roles
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{role_id}/members")
async def list_role_members(
    role_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        members = await graph_service.get_directory_role_members(role_id)
        return members
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant/{tenant_id}/{role_id}/members")
async def list_role_members_by_tenant(
    tenant_id: int,
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        graph_service = await get_graph_service_by_id(tenant_id, db)
        members = await graph_service.get_directory_role_members(role_id)
        return members
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assign", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def assign_role(
    role_assignment: O365RoleAssignment,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        await graph_service.add_directory_role_member(
            role_id=role_assignment.role_id,
            user_id=role_assignment.user_id
        )
        return MessageResponse(message="Role assigned successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revoke", response_model=MessageResponse)
async def revoke_role(
    role_assignment: O365RoleAssignment,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        await graph_service.remove_directory_role_member(
            role_id=role_assignment.role_id,
            user_id=role_assignment.user_id
        )
        return MessageResponse(message="Role revoked successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/promote", response_model=MessageResponse)
async def promote_to_global_admin(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        await graph_service.add_directory_role_member(
            role_id=GLOBAL_ADMIN_ROLE_ID,
            user_id=user_id
        )
        return MessageResponse(message="User promoted to Global Administrator")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/demote", response_model=MessageResponse)
async def demote_from_global_admin(
    user_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        await graph_service.remove_directory_role_member(
            role_id=GLOBAL_ADMIN_ROLE_ID,
            user_id=user_id
        )
        return MessageResponse(message="User demoted from Global Administrator")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
