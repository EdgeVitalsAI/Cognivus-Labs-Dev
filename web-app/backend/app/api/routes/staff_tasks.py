from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from ...core.database import get_db
from ...models.staff_task import StaffTask, TaskStatus, TaskPriority, TaskCategory

router = APIRouter()


class TaskCreateRequest(BaseModel):
    assigned_to_id: int
    assigned_by_id: Optional[int] = None
    patient_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: TaskCategory
    priority: TaskPriority
    due_date: Optional[datetime] = None
    location: Optional[str] = None
    special_instructions: Optional[str] = None


@router.get("/tasks")
async def get_all_tasks(
    assigned_to_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all staff tasks"""

    query = db.query(StaffTask)

    if assigned_to_id:
        query = query.filter(StaffTask.assigned_to_id == assigned_to_id)
    if status:
        query = query.filter(StaffTask.status == status)
    if priority:
        query = query.filter(StaffTask.priority == priority)

    total = query.count()
    tasks = query.order_by(desc(StaffTask.priority), StaffTask.due_date).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "tasks": [{
            "id": t.id,
            "assigned_to_id": t.assigned_to_id,
            "assigned_to_name": t.assigned_to.full_name if t.assigned_to else "Unknown",
            "patient_id": t.patient_id,
            "patient_name": t.patient.name if t.patient else None,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "location": t.location,
            "created_at": t.created_at.isoformat()
        } for t in tasks]
    }


@router.post("/tasks")
async def create_task(task_data: TaskCreateRequest, db: Session = Depends(get_db)):
    """Create new staff task"""

    try:
        task = StaffTask(
            assigned_to_id=task_data.assigned_to_id,
            assigned_by_id=task_data.assigned_by_id,
            patient_id=task_data.patient_id,
            title=task_data.title,
            description=task_data.description,
            category=task_data.category,
            priority=task_data.priority,
            due_date=task_data.due_date,
            location=task_data.location,
            special_instructions=task_data.special_instructions,
            status=TaskStatus.PENDING
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        return {
            "status": "success",
            "message": "Task created successfully",
            "task": {
                "id": task.id,
                "title": task.title
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}"
        )


@router.patch("/tasks/{task_id}")
async def update_task_status(
    task_id: int,
    status: TaskStatus,
    completion_notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update task status"""

    task = db.query(StaffTask).filter(StaffTask.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        task.status = status
        if status == TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()
            task.completion_notes = completion_notes
        elif status == TaskStatus.IN_PROGRESS:
            task.started_at = datetime.utcnow()

        task.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Task updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}"
        )


@router.get("/tasks/statistics/summary")
async def get_tasks_stats(db: Session = Depends(get_db)):
    """Get staff tasks statistics"""

    total = db.query(StaffTask).count()
    pending = db.query(StaffTask).filter(StaffTask.status == TaskStatus.PENDING).count()
    in_progress = db.query(StaffTask).filter(StaffTask.status == TaskStatus.IN_PROGRESS).count()
    completed = db.query(StaffTask).filter(StaffTask.status == TaskStatus.COMPLETED).count()

    return {
        "total_tasks": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed
    }
