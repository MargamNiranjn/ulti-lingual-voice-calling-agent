import os
import sys
# Ensure app modules can be resolved relative to backend folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.security import get_password_hash, verify_password, create_access_token
import jwt

def test_password_hashing():
    password = "supersecretpassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_token_creation():
    data = {"sub": "janesmith", "role": "Sales Manager"}
    token = create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    
    # Decode token and verify contents
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-key-replace-in-production")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    
    decoded = jwt.decode(token, secret, algorithms=[algorithm])
    assert decoded["sub"] == "janesmith"
    assert decoded["role"] == "Sales Manager"
    assert "exp" in decoded

if __name__ == "__main__":
    print("Running local verification tests...")
    test_password_hashing()
    test_jwt_token_creation()
    print("All tests passed successfully!")
