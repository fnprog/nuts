package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/migration"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/migration/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/rs/zerolog"
)

type Handler struct {
	service   service.Migration
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Migration, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{
		service,
		validator,
		logger,
	}
}

func (h *Handler) MigrateData(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	var req migration.MigrateDataRequest

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	result, err := h.service.MigrateData(ctx, userID, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		clientErr := message.ErrInternalError

		switch err {
		case migration.ErrMigrationNotFound:
			statusCode = http.StatusNotFound
			clientErr = migration.ErrMigrationNotFound
		case migration.ErrMigrationAlreadyDone:
			statusCode = http.StatusConflict
			clientErr = migration.ErrMigrationAlreadyDone
		case migration.ErrInvalidMigrationData:
			statusCode = http.StatusBadRequest
			clientErr = migration.ErrInvalidMigrationData
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  clientErr,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl":   r.RequestURI,
				"operation":    "MigrateData",
				"migration_id": req.MigrationID,
				"anonymous_id": req.AnonymousUserID,
				"categories":   len(req.Items.Categories),
				"accounts":     len(req.Items.Accounts),
				"transactions": len(req.Items.Transactions),
			},
		})
		return
	}

	respond.Json(w, http.StatusOK, result, h.logger)
}

func (h *Handler) GetMigrationStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	migrationID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl": r.RequestURI,
				"operation":  "GetMigrationStatus",
			},
		})
		return
	}

	record, err := h.service.GetMigrationStatus(ctx, userID, migrationID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		clientErr := message.ErrInternalError

		if err == migration.ErrMigrationNotFound {
			statusCode = http.StatusNotFound
			clientErr = migration.ErrMigrationNotFound
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  clientErr,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl":   r.RequestURI,
				"operation":    "GetMigrationStatus",
				"migration_id": migrationID,
			},
		})
		return
	}

	respond.Json(w, http.StatusOK, record, h.logger)
}

func (h *Handler) ListUserMigrations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	limit := int32(10)

	records, err := h.service.GetUserMigrations(ctx, userID, limit)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl": r.RequestURI,
				"operation":  "ListUserMigrations",
			},
		})
		return
	}

	respond.Json(w, http.StatusOK, records, h.logger)
}
