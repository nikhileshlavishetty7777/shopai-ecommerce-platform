from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime
import re

from app.models.user import User, Address, UserRole
from app.schemas.user import UserCreate, UserUpdate, AddressCreate, AddressUpdate
from app.core.security import get_password_hash, verify_password


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email, User.is_deleted == False).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username, User.is_deleted == False).first()

    def create(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            phone=data.phone,
            hashed_password=get_password_hash(data.password),
            role=UserRole.CUSTOMER,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_admin(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            phone=data.phone,
            hashed_password=get_password_hash(data.password),
            role=UserRole.ADMIN,
            is_verified=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, data: UserUpdate) -> User:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        if not verify_password(current_password, user.hashed_password):
            return False
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        return True

    def reset_password(self, user: User, new_password: str) -> User:
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        return user

    def update_last_login(self, user: User):
        user.last_login = datetime.utcnow()
        self.db.commit()

    def verify_email(self, user: User) -> User:
        user.is_verified = True
        self.db.commit()
        return user

    def deactivate(self, user: User) -> User:
        user.is_active = False
        self.db.commit()
        return user

    def activate(self, user: User) -> User:
        user.is_active = True
        self.db.commit()
        return user

    def soft_delete(self, user: User) -> User:
        user.is_deleted = True
        user.is_active = False
        user.deleted_at = datetime.utcnow()
        self.db.commit()
        return user

    def list_users(self, skip: int = 0, limit: int = 20, search: Optional[str] = None) -> List[User]:
        query = self.db.query(User).filter(User.is_deleted == False)
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                )
            )
        return query.offset(skip).limit(limit).all()

    def count_users(self, search: Optional[str] = None) -> int:
        query = self.db.query(User).filter(User.is_deleted == False)
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                )
            )
        return query.count()

    # ─── Address Management ───────────────────────────────────────────────

    def get_addresses(self, user_id: int) -> List[Address]:
        return (
            self.db.query(Address)
            .filter(Address.user_id == user_id, Address.is_deleted == False)
            .all()
        )

    def get_address(self, address_id: int, user_id: int) -> Optional[Address]:
        return (
            self.db.query(Address)
            .filter(Address.id == address_id, Address.user_id == user_id, Address.is_deleted == False)
            .first()
        )

    def create_address(self, user_id: int, data: AddressCreate) -> Address:
        if data.is_default:
            self.db.query(Address).filter(
                Address.user_id == user_id, Address.is_deleted == False
            ).update({"is_default": False})

        address = Address(user_id=user_id, **data.model_dump())
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        return address

    def update_address(self, address: Address, data: AddressUpdate) -> Address:
        if data.is_default:
            self.db.query(Address).filter(
                Address.user_id == address.user_id, Address.is_deleted == False
            ).update({"is_default": False})

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(address, field, value)
        self.db.commit()
        self.db.refresh(address)
        return address

    def delete_address(self, address: Address):
        address.is_deleted = True
        self.db.commit()
