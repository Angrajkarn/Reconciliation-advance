from fastapi import Depends, HTTPException, status
from app.api import deps
from app.models.user import User

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(deps.get_current_user)):
        user_roles = [r.name for r in user.roles]
        if not any(role in self.allowed_roles for role in user_roles):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role"
            )
        return user

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, user: User = Depends(deps.get_current_user)):
        # Flatten permissions from all roles
        # In a real engine, we'd parse the JSON or query a Permission table
        # Here we simulate simple string matching or "ALL" wildcard
        
        all_permissions = set()
        for role in user.roles:
            # role.permissions is a JSON string e.g. ["READ", "WRITE"]
            if role.permissions:
                import json
                try:
                    perms = json.loads(role.permissions)
                    for p in perms:
                        all_permissions.add(p)
                except:
                   pass

        if "ALL" in all_permissions:
            return user
            
        if self.required_permission not in all_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Missing permission: {self.required_permission}"
            )
        return user
