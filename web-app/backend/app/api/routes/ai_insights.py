from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.ai_insight import AIInsight, InsightType, InsightSeverity, InsightStatus

router = APIRouter()


class InsightCreateRequest(BaseModel):
    patient_id: int
    insight_type: InsightType
    severity: InsightSeverity
    title: str
    description: str
    recommendation: Optional[str] = None
    risk_score: Optional[float] = None
    confidence_score: Optional[float] = None
    model_name: Optional[str] = None
    is_actionable: Optional[bool] = True
    requires_immediate_attention: Optional[bool] = False


@router.get("/ai-insights")
async def get_all_insights(
    patient_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all AI insights"""

    query = db.query(AIInsight)

    if patient_id:
        query = query.filter(AIInsight.patient_id == patient_id)
    if severity:
        query = query.filter(AIInsight.severity == severity)
    if status:
        query = query.filter(AIInsight.status == status)

    total = query.count()
    insights = query.order_by(desc(AIInsight.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "insights": [{
            "id": i.id,
            "patient_id": i.patient_id,
            "patient_name": i.patient.name if i.patient else "Unknown",
            "insight_type": i.insight_type,
            "severity": i.severity,
            "title": i.title,
            "description": i.description,
            "recommendation": i.recommendation,
            "risk_score": i.risk_score,
            "confidence_score": i.confidence_score,
            "status": i.status,
            "is_actionable": i.is_actionable,
            "requires_immediate_attention": i.requires_immediate_attention,
            "created_at": i.created_at.isoformat()
        } for i in insights]
    }


@router.post("/ai-insights")
async def create_insight(insight_data: InsightCreateRequest, db: Session = Depends(get_db)):
    """Create new AI insight"""

    try:
        insight = AIInsight(
            patient_id=insight_data.patient_id,
            insight_type=insight_data.insight_type,
            severity=insight_data.severity,
            title=insight_data.title,
            description=insight_data.description,
            recommendation=insight_data.recommendation,
            risk_score=insight_data.risk_score,
            confidence_score=insight_data.confidence_score,
            model_name=insight_data.model_name,
            is_actionable=insight_data.is_actionable,
            requires_immediate_attention=insight_data.requires_immediate_attention,
            status=InsightStatus.PENDING_REVIEW
        )

        db.add(insight)
        db.commit()
        db.refresh(insight)

        return {
            "status": "success",
            "message": "AI insight created successfully",
            "insight": {
                "id": insight.id,
                "severity": insight.severity
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create insight: {str(e)}"
        )


@router.get("/ai-insights/statistics/summary")
async def get_insights_stats(db: Session = Depends(get_db)):
    """Get AI insights statistics"""

    total = db.query(AIInsight).count()
    critical = db.query(AIInsight).filter(AIInsight.severity == InsightSeverity.CRITICAL).count()
    pending = db.query(AIInsight).filter(AIInsight.status == InsightStatus.PENDING_REVIEW).count()

    return {
        "total_insights": total,
        "critical_insights": critical,
        "pending_review": pending
    }
