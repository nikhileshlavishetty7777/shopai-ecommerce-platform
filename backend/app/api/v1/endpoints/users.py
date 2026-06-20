from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate, AddressCreate, AddressUpdate, AddressResponse
from app.services.user_service import UserService
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])


@router.put("/me", response_model=dict)
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = UserService(db)
    user = svc.update(current_user, data)
    return {"message": "Profile updated", "user": {"full_name": user.full_name, "phone": user.phone}}


@router.get("/me/addresses")
def get_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addresses = UserService(db).get_addresses(current_user.id)
    return {
        "addresses": [
            {
                "id": a.id, "label": a.label, "full_name": a.full_name, "phone": a.phone,
                "address_line1": a.address_line1, "address_line2": a.address_line2,
                "city": a.city, "state": a.state, "postal_code": a.postal_code,
                "country": a.country, "is_default": a.is_default,
            }
            for a in addresses
        ]
    }


@router.post("/me/addresses", status_code=201)
def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = UserService(db).create_address(current_user.id, data)
    return {"message": "Address created", "address_id": address.id}


@router.put("/me/addresses/{address_id}")
def update_address(
    address_id: int,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = UserService(db)
    address = svc.get_address(address_id, current_user.id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    svc.update_address(address, data)
    return {"message": "Address updated"}


@router.delete("/me/addresses/{address_id}")
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = UserService(db)
    address = svc.get_address(address_id, current_user.id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    svc.delete_address(address)
    return {"message": "Address deleted"}
