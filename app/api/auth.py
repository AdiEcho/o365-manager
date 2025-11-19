from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import User
from app.schemas import (
    LoginRequest, 
    TokenResponse, 
    ChangePasswordRequest, 
    MessageResponse, 
    UserResponse, 
    RegisterRequest,
    SystemStatusResponse
)
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/system-status", response_model=SystemStatusResponse)
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """Check if system needs initialization (first user registration)"""
    result = await db.execute(select(func.count(User.id)))
    user_count = result.scalar() or 0
    
    return SystemStatusResponse(
        needs_initialization=user_count == 0,
        user_count=user_count
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register first admin user (only works when no users exist)"""
    # Check if any users exist
    result = await db.execute(select(func.count(User.id)))
    user_count = result.scalar() or 0
    
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="系统已初始化，无法注册新用户。请联系管理员。",
        )
    
    # Check if username already exists (should not happen, but just in case)
    result = await db.execute(select(User).where(User.username == register_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )
    
    # Check if email already exists
    if register_data.email:
        result = await db.execute(select(User).where(User.email == register_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用",
            )
    
    # Create first admin user
    new_user = User(
        username=register_data.username,
        email=register_data.email,
        hashed_password=get_password_hash(register_data.password),
        is_active=True,
        is_superuser=True  # First user is always superuser
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate access token
    access_token = create_access_token(data={"sub": new_user.username})
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误",
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()
    
    return MessageResponse(message="密码修改成功")
