from fastapi import APIRouter, Depends, HTTPException, Response
from app.services.graph_service import GraphAPIService
from app.api.o365_users import get_graph_service

router = APIRouter(prefix="/api/o365/reports", tags=["O365 Reports"])


@router.get("/organization")
async def get_organization_info(
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        org = await graph_service.get_organization()
        return org
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/onedrive")
async def get_onedrive_usage_report(
    period: str = "D7",
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        report_data = await graph_service.get_onedrive_usage_report(period)
        return Response(
            content=report_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=onedrive_usage_{period}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchange")
async def get_exchange_usage_report(
    period: str = "D7",
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        report_data = await graph_service.get_exchange_usage_report(period)
        return Response(
            content=report_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=exchange_usage_{period}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
