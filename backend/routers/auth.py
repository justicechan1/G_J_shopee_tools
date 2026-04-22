from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from dependencies import get_supabase
from schemas.auth import LoginRequest, LoginResponse, RefreshRequest, UserOut

router = APIRouter(prefix="/api/auth", tags=["인증"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, sb: Client = Depends(get_supabase)):
    try:
        res = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="이메일 또는 비밀번호가 올바르지 않습니다")

    session = res.session
    user    = res.user
    if not session or not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인에 실패했습니다")

    return LoginResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user=UserOut(id=str(user.id), email=user.email),
    )


@router.post("/refresh")
def refresh_token(body: RefreshRequest, sb: Client = Depends(get_supabase)):
    try:
        res = sb.auth.refresh_session(body.refresh_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 갱신에 실패했습니다")

    session = res.session
    return {
        "access_token":  session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in":    session.expires_in,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(sb: Client = Depends(get_supabase)):
    try:
        sb.auth.sign_out()
    except Exception:
        pass
