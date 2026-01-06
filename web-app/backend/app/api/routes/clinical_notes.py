from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.clinical_note import ClinicalNote, NoteType
from ...models.patient import Patient

router = APIRouter()


class NoteCreateRequest(BaseModel):
    patient_id: int
    created_by_id: int
    note_type: NoteType
    title: str
    specialty: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    content: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    visit_date: Optional[datetime] = None
    visit_type: Optional[str] = None


@router.get("/notes")
async def get_all_notes(
    patient_id: Optional[int] = None,
    note_type: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all clinical notes"""

    query = db.query(ClinicalNote)

    if patient_id:
        query = query.filter(ClinicalNote.patient_id == patient_id)
    if note_type:
        query = query.filter(ClinicalNote.note_type == note_type)

    total = query.count()
    notes = query.order_by(desc(ClinicalNote.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "notes": [{
            "id": n.id,
            "patient_id": n.patient_id,
            "patient_name": n.patient.name if n.patient else "Unknown",
            "created_by_id": n.created_by_id,
            "created_by_name": n.created_by.full_name if n.created_by else "Unknown",
            "note_type": n.note_type,
            "title": n.title,
            "specialty": n.specialty,
            "subjective": n.subjective,
            "objective": n.objective,
            "assessment": n.assessment,
            "plan": n.plan,
            "content": n.content,
            "diagnosis": n.diagnosis,
            "visit_date": n.visit_date.isoformat() if n.visit_date else None,
            "visit_type": n.visit_type,
            "created_at": n.created_at.isoformat()
        } for n in notes]
    }


@router.post("/notes")
async def create_note(note_data: NoteCreateRequest, db: Session = Depends(get_db)):
    """Create new clinical note"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == note_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        note = ClinicalNote(
            patient_id=note_data.patient_id,
            created_by_id=note_data.created_by_id,
            note_type=note_data.note_type,
            title=note_data.title,
            specialty=note_data.specialty,
            subjective=note_data.subjective,
            objective=note_data.objective,
            assessment=note_data.assessment,
            plan=note_data.plan,
            content=note_data.content,
            diagnosis=note_data.diagnosis,
            treatment_plan=note_data.treatment_plan,
            follow_up_instructions=note_data.follow_up_instructions,
            visit_date=note_data.visit_date or datetime.utcnow(),
            visit_type=note_data.visit_type
        )

        db.add(note)
        db.commit()
        db.refresh(note)

        return {
            "status": "success",
            "message": "Clinical note created successfully",
            "note": {
                "id": note.id,
                "patient_id": note.patient_id,
                "title": note.title
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get("/notes/statistics/summary")
async def get_notes_stats(db: Session = Depends(get_db)):
    """Get clinical notes statistics"""

    total = db.query(ClinicalNote).count()
    progress_notes = db.query(ClinicalNote).filter(
        ClinicalNote.note_type == NoteType.PROGRESS_NOTE
    ).count()

    return {
        "total_notes": total,
        "progress_notes": progress_notes
    }
