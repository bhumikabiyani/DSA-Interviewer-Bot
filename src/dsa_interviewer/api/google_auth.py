from datetime import datetime

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from dsa_interviewer.core.config import settings
from dsa_interviewer.core.database import get_db
from dsa_interviewer.models.user import User
from dsa_interviewer.utils.jwt import create_access_token

router = APIRouter()

# Matches what you configured in Google Console
FRONTEND_REDIRECT_URI = "http://localhost:3000/auth/callback"

@router.get("/login-url")
def get_login_url():
    """
    Returns the Google OAuth URL so the frontend can redirect the user.
    """
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": FRONTEND_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    # Construct URL manually
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return {"url": f"{base_url}?{query_string}"}

@router.post("/verify")
async def verify_google_code(code: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Exchanges the authorization code for an ID token and verifies it.
    """
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": FRONTEND_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange code: {response.text}")

        token_data = response.json()
        token_data.get("id_token")
        access_token = token_data.get("access_token") # Google access token, not ours

        # Get User Info
        user_info_resp = await client.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        if user_info_resp.status_code != 200:
             raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        user_info = user_info_resp.json()

    # Process User
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in Google account")

    # Check/Create User
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        username = email.split('@')[0]
        # Uniqueness check
        if db.query(User).filter(User.username == username).first():
            username = f"{username}_{int(datetime.utcnow().timestamp())}"

        print(f"Creating new Google user (Verification Flow): {username}, {email}")
        db_user = User(
            username=username,
            email=email,
            hashed_password=None
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # Issue our JWT
    our_access_token = create_access_token(data={"sub": db_user.username})

    return {"access_token": our_access_token, "token_type": "bearer"}
