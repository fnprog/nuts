package tags

import (
	"github.com/google/uuid"
)

type TagRequest struct {
	Name  string `json:"name" validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type TagUpdateRequest struct {
	Name  *string `json:"name" validate:"required,min=1,max=50"`
	Color *string `json:"color" validate:"required,hexcolor"`
}

type TagResponse struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Color string    `json:"color"`
}
