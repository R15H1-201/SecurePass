from backend.schemas.password import PasswordSettings
def get_enabled_character_types(
    settings: PasswordSettings
) -> list[str]:
    enabled_types = []
    if settings.include_uppercase:
        enabled_types.append("uppercase")
    if settings.include_lowercase:
        enabled_types.append("lowercase")
    if settings.include_digits:
        enabled_types.append("digits")
    if settings.include_symbols:
        enabled_types.append("symbols")
    return enabled_types