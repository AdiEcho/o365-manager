from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
from pathlib import Path
from app.database import get_db
from app.schemas import O365LicenseResponse
from app.services.graph_service import GraphAPIService
from app.api.o365_users import get_graph_service, get_graph_service_by_id

router = APIRouter(prefix="/api/o365/licenses", tags=["O365 Licenses"])

# Load SKU mapping
SKU_MAP_PATH = Path(__file__).parent.parent / "sku_map.json"
try:
    with open(SKU_MAP_PATH, "r", encoding="utf-8") as f:
        SKU_MAP = json.load(f)
except Exception as e:
    print(f"Warning: Failed to load sku_map.json: {e}")
    SKU_MAP = {}


def get_sku_name_cn(sku_part_number: str) -> str:
    """Get Chinese name for SKU, fallback to SKU part number if not found"""
    return SKU_MAP.get(sku_part_number, sku_part_number)


@router.get("", response_model=List[O365LicenseResponse])
async def list_licenses(
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        skus = await graph_service.get_subscribed_skus()
        
        licenses = []
        for sku in skus:
            prepaid_units = sku.get("prepaidUnits", {})
            sku_part_number = sku.get("skuPartNumber")
            licenses.append(O365LicenseResponse(
                sku_id=sku.get("skuId"),
                sku_part_number=sku_part_number,
                sku_name_cn=get_sku_name_cn(sku_part_number),
                consumed_units=sku.get("consumedUnits", 0),
                enabled_units=prepaid_units.get("enabled", 0),
                available_units=prepaid_units.get("enabled", 0) - sku.get("consumedUnits", 0)
            ))
        
        return licenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant/{tenant_id}", response_model=List[O365LicenseResponse])
async def list_licenses_by_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get licenses for a specific tenant by ID"""
    try:
        graph_service = await get_graph_service_by_id(tenant_id, db)
        skus = await graph_service.get_subscribed_skus()
        
        licenses = []
        for sku in skus:
            prepaid_units = sku.get("prepaidUnits", {})
            sku_part_number = sku.get("skuPartNumber")
            licenses.append(O365LicenseResponse(
                sku_id=sku.get("skuId"),
                sku_part_number=sku_part_number,
                sku_name_cn=get_sku_name_cn(sku_part_number),
                consumed_units=sku.get("consumedUnits", 0),
                enabled_units=prepaid_units.get("enabled", 0),
                available_units=prepaid_units.get("enabled", 0) - sku.get("consumedUnits", 0)
            ))
        
        return licenses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
