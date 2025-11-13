package budgets

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/rs/zerolog"
)

type Handler struct {
	v      *validation.Validator
	tkn    *jwt.Service
	repo   Repository
	logger *zerolog.Logger
}

func NewHandler(validator *validation.Validator, tokenService *jwt.Service, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, tokenService, repo, logger}
}

func (h *Handler) GetBudgetProgress(w http.ResponseWriter, r *http.Request) {}
