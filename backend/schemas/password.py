from pydantic import BaseModel, Field, model_validator


class PasswordSettings(BaseModel):

    length: int = Field(
        default=16,
        ge=8,
        le=64,
        description="Password length must be between 8 and 64"
    )

    include_uppercase: bool = True
    include_lowercase: bool = True
    include_digits: bool = True
    include_symbols: bool = True

    @model_validator(mode="after")
    def validate_character_types(self):

        if not any([
            self.include_uppercase,
            self.include_lowercase,
            self.include_digits,
            self.include_symbols
        ]):
            raise ValueError(
                "At least one character type must be selected"
            )

        return self

class PasswordSettingsResponse(BaseModel):
    message: str
    length: int
    enabled_character_types: list[str]