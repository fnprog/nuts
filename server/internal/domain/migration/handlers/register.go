package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/migration/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Migration, validator *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)
	router := router.NewRouter()
	router.Use(middleware.Verify)

	router.Post("/", h.MigrateData)
	router.Get("/{id}", h.GetMigrationStatus)
	router.Get("/", h.ListUserMigrations)

	return router
}
