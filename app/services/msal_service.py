import msal
from typing import Optional, Dict, Any
from app.config import get_settings

settings = get_settings()


class MSALService:
    def __init__(self, tenant_id: str, client_id: str, client_secret: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.authority = f"https://login.microsoftonline.com/{tenant_id}"
        self.scope = [settings.graph_api_scope]
        self._app = None
    
    @property
    def app(self):
        if self._app is None:
            self._app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret,
            )
        return self._app
    
    def get_access_token(self) -> Optional[str]:
        result = self.app.acquire_token_for_client(scopes=self.scope)
        
        if "access_token" in result:
            return result["access_token"]
        else:
            error = result.get("error")
            error_description = result.get("error_description")
            raise Exception(f"Failed to acquire token: {error} - {error_description}")
    
    async def validate_credentials(self) -> Dict[str, Any]:
        try:
            token = self.get_access_token()
            return {
                "valid": True,
                "token": token
            }
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
