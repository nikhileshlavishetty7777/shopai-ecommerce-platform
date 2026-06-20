from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, AccessTokenResponse
from app.schemas.user import UserCreate, UserResponse, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.user_service import UserService
from app.core.security import (
    verify_password, create_access_token, create_refresh_token, decode_token,
    create_password_reset_token, verify_password_reset_token,
)
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    svc = UserService(db)
    if svc.get_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if svc.get_by_username(data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = svc.create(data)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    svc = UserService(db)
    user = svc.get_by_email(data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    svc.update_last_login(user)
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = UserService(db).get_by_id(int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AccessTokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = UserService(db)
    if not svc.change_password(current_user, data.current_password, data.new_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = UserService(db).get_by_email(data.email)
    # Always return success to prevent email enumeration
    if user:
        token = create_password_reset_token(user.email)
        # In production, send via email. For now return token.
        return {"message": "Reset link sent", "reset_token": token}
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_password_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    svc = UserService(db)
    user = svc.get_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    svc.reset_password(user, data.new_password)
    return {"message": "Password reset successfully"}
