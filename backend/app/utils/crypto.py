import base64
import hashlib
from cryptography.fernet import Fernet
from app.config import settings

# Fernet key is derived deterministically from SECRET_KEY.
# WARNING: rotating SECRET_KEY will invalidate all stored encrypted values.
def _fernet() -> Fernet:
    raw = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(raw))


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()
