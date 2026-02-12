from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import O365DomainResponse, MessageResponse
from app.services.graph_service import GraphAPIService
from app.api.o365_users import get_graph_service
from app.api.deps import get_graph_service_by_id
from app.auth import get_current_user

router = APIRouter(prefix="/api/o365/domains", tags=["O365 Domains"])


@router.get("", response_model=List[O365DomainResponse])
async def list_domains(
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        domains = await graph_service.get_domains()
        return [O365DomainResponse(**domain) for domain in domains]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant/{tenant_id}", response_model=List[O365DomainResponse])
async def list_domains_by_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        graph_service = await get_graph_service_by_id(tenant_id, db)
        domains = await graph_service.get_domains()
        return [O365DomainResponse(**domain) for domain in domains]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{domain_id}", response_model=O365DomainResponse)
async def get_domain(
    domain_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        domain = await graph_service.get_domain(domain_id)
        return O365DomainResponse(**domain)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=O365DomainResponse, status_code=status.HTTP_201_CREATED)
async def create_domain(
    domain_name: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        domain = await graph_service.create_domain(domain_name)
        return O365DomainResponse(**domain)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{domain_id}/verify", response_model=O365DomainResponse)
async def verify_domain(
    domain_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        domain = await graph_service.verify_domain(domain_id)
        return O365DomainResponse(**domain)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{domain_id}", response_model=MessageResponse)
async def delete_domain(
    domain_id: str,
    graph_service: GraphAPIService = Depends(get_graph_service),
    current_user: User = Depends(get_current_user)
):
    try:
        await graph_service.delete_domain(domain_id)
        return MessageResponse(
            message="Domain deletion initiated",
            detail="Domain deletion may take up to 24 hours"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
