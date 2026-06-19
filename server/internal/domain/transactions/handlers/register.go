package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Transactions, tkn *jwt.Service, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)

	// ai
	router.Post("/neural-input", h.ParseTransactions)

	return router
}
