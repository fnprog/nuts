package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
)

type Handler struct {
	queries *repository.Queries
	logger  *zerolog.Logger
}

func NewHandler(queries *repository.Queries, logger *zerolog.Logger) *Handler {
	return &Handler{
		queries: queries,
		logger:  logger,
	}
}

type SyncResponse struct {
	Accounts        []repository.GetAccountsSinceRow     `json:"accounts"`
	Categories      []repository.Category                `json:"categories"`
	Transactions    []repository.GetTransactionsSinceRow `json:"transactions"`
	Budgets         []repository.Budget                  `json:"budgets"`
	Tags            []repository.Tag                     `json:"tags"`
	Preferences     []repository.Preference              `json:"preferences"`
	ServerTimestamp string                               `json:"server_timestamp"`
}

func (h *Handler) Sync(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

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

	q := r.URL.Query()
	var sinceTime *time.Time
	if since := q.Get("since"); since != "" {
		if parsedTime, parseErr := time.Parse(time.RFC3339, since); parseErr == nil {
			sinceTime = &parsedTime
		}
	}

	if sinceTime == nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  errors.New("missing 'since' query parameter"),
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	response := SyncResponse{
		ServerTimestamp: time.Now().Format(time.RFC3339),
	}

	pgSince := pgtype.Timestamptz{
		Time:  *sinceTime,
		Valid: true,
	}

	userIDPtr := &userID

	accounts, err := h.queries.GetAccountsSince(ctx, repository.GetAccountsSinceParams{
		UserID: userIDPtr,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetAccountsSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Accounts = accounts

	categories, err := h.queries.GetCategoriesSince(ctx, repository.GetCategoriesSinceParams{
		UserID: userID,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetCategoriesSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Categories = categories

	transactions, err := h.queries.GetTransactionsSince(ctx, repository.GetTransactionsSinceParams{
		UserID: userIDPtr,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetTransactionsSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Transactions = transactions

	budgets, err := h.queries.GetBudgetsSince(ctx, repository.GetBudgetsSinceParams{
		UserID: userID,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetBudgetsSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Budgets = budgets

	tags, err := h.queries.GetTagsSince(ctx, repository.GetTagsSinceParams{
		UserID: userID,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetTagsSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Tags = tags

	preferences, err := h.queries.GetPreferencesSince(ctx, repository.GetPreferencesSinceParams{
		UserID: userID,
		Since:  pgSince,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"operation": "GetPreferencesSince",
				"userID":    userID,
				"since":     sinceTime,
			},
		})
		return
	}
	response.Preferences = preferences

	respond.Json(w, http.StatusOK, response, h.logger)
}
