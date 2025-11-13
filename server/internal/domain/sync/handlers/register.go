package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(queries *repository.Queries, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	h := NewHandler(queries, logger)

	middleware := jwt.NewMiddleware(tkn)
	r := router.NewRouter()
	r.Use(middleware.Verify)

	r.Get("/", h.Sync)

	return r
}
