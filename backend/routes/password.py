from fastapi import APIRouter

from backend.schemas.password import (
    PasswordSettings,
    PasswordSettingsResponse
)

from backend.services.password_service import (
    get_enabled_character_types
)

router = APIRouter()


@router.post(
    "/password/settings",
    response_model=PasswordSettingsResponse
)
def password_settings(
    settings: PasswordSettings
) -> PasswordSettingsResponse:

    enabled_types = get_enabled_character_types(settings)

    return {
        "message": "Password settings received successfully",
        "length": settings.length,
        "enabled_character_types": enabled_types
    }
