package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
	"github.com/rs/zerolog"
)

type Handler struct {
	service   service.Transactions
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Transactions, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{service, validator, logger}
}

func (h *Handler) ParseTransactions(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	var req llm.NeuralInputRequest
	ctx := r.Context()

	valErr, err := h.validator.ParseAndValidate(r, &req)
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

	h.logger.Info().
		Str("user_id", userID.String()).
		Str("input", req.Input).
		Msg("Processing neural input for transaction parsing")

	response, err := h.service.ParseTransactions(ctx, req)
	if err != nil {
		h.logger.Error().
			Err(err).
			Str("user_id", userID.String()).
			Msg("Failed to parse transactions from neural input")

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	h.logger.Info().
		Str("user_id", userID.String()).
		Int("transactions_count", len(response.Transactions)).
		Str("model", response.Model).
		Msg("Successfully parsed transactions from neural input")

	respond.Json(w, http.StatusOK, response, h.logger)
}

// AutomatedImportTransaction handles transactions coming from automated sources (e.g., receipt parser).
// This endpoint expects a pre-shared API key or service account token
// to identify the source and map to a specific user/account.
// func AutomatedImport(w http.ResponseWriter, r *http.Request) {
// 	// Authentication for this endpoint must be different from standard JWT user auth.
// 	// Use an API key/service account token. For now, a simple header check.
// 	// In a real system, you'd use a more sophisticated API key management system.
//
// 	apiKey := r.Header.Get("X-Nuts-Key") // Assuming "Bearer YOUR_API_KEY"
// 	if apiKey == "" {
// 		http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
// 		return
// 	}
//
// 	// Map API key to a specific user ID and an associated default account ID.
// 	// This mapping would ideally be in a `service_accounts` table or config.
// 	// For demo, hardcode a mapping or infer from API key.
// 	// Let's assume a default `receipt_parser_user_id` and `receipt_parser_account_id`
// 	// configured in environment variables or config files.
//
// 	// Fetch this from DB or env for a specific 'system user' for automation
// 	var systemUserID string
// 	var systemAccountID string
//
// 	// In a production system, this could be:
// 	// var user models.User
// 	// db.GetDB().QueryRow("SELECT user_id, default_account_id FROM automated_importers WHERE api_key = $1", apiKey).Scan(...)
// 	// For simplicity, let's just use a hardcoded system user (needs to exist in `users` table)
// 	systemUserID = os.Getenv("RECEIPT_PARSER_USER_ID")
// 	systemAccountID = os.Getenv("RECEIPT_PARSER_ACCOUNT_ID") // default account for receipts
//
// 	if systemUserID == "" || systemAccountID == "" {
// 		http.Error(w, "Automated import not configured (missing user/account ID mapping)", http.StatusInternalServerError)
// 		config.Log.Error("Automated import received, but system user/account not configured.")
// 		return
// 	}
//
// 	parsedSystemUserID, _ := uuid.Parse(systemUserID)
// 	parsedSystemAccountID, _ := uuid.Parse(systemAccountID)
//
// 	var reqPayload struct {
// 		Description string  `json:"description"`
// 		Amount      float64 `json:"amount"`
// 		Date        string  `json:"date"` // YYYY-MM-DD
// 		Type        string  `json:"type"` // "expense", "income"
// 		Source      string  `json:"source"`
// 	}
//
// 	bodyBytes, err := ioutil.ReadAll(r.Body)
// 	if err != nil {
// 		http.Error(w, "Failed to read request body", http.StatusBadRequest)
// 		return
// 	}
// 	if err := json.Unmarshal(bodyBytes, &reqPayload); err != nil {
// 		config.Log.WithError(err).WithField("body", string(bodyBytes)).Error("Failed to parse automated import request body")
// 		http.Error(w, "Invalid request body format", http.StatusBadRequest)
// 		return
// 	}
//
// 	txDate, err := time.Parse("2006-01-02", reqPayload.Date)
// 	if err != nil {
// 		http.Error(w, "Invalid date format. Expected YYYY-MM-DD", http.StatusBadRequest)
// 		return
// 	}
//
// 	// Auto-categorize using AI service for automated imports
// 	var categoryID *uuid.UUID
// 	var isCategorized bool = false
// 	predictedCategoryName, aiErr := callAIPredictCategory(reqPayload.Description) // Reuse AI prediction
// 	if aiErr == nil && predictedCategoryName != "" {
// 		var catID uuid.UUID
// 		// Try to find a matching category by name (global or system user's specific)
// 		catQuery := `SELECT id FROM categories WHERE name = $1 AND (user_id IS NULL OR user_id = $2) LIMIT 1`
// 		err = db.GetDB().QueryRow(catQuery, predictedCategoryName, parsedSystemUserID).Scan(&catID)
// 		if err == nil {
// 			categoryID = &catID
// 			isCategorized = true
// 		} else {
// 			config.Log.WithField("categoryName", predictedCategoryName).Warn("AI predicted category not found in DB for automated import.")
// 		}
// 	} else if aiErr != nil {
// 		config.Log.WithError(aiErr).Warn("AI categorization failed for automated import.")
// 	}
//
// 	newTransaction := models.Transaction{
// 		UserID:        parsedSystemUserID,
// 		AccountID:     parsedSystemAccountID,
// 		Description:   reqPayload.Description,
// 		Amount:        reqPayload.Amount,
// 		Type:          reqPayload.Type,
// 		Date:          txDate,
// 		CategoryID:    categoryID,
// 		IsCategorized: isCategorized,
// 		CreatedAt:     time.Now(),
// 		UpdatedAt:     time.Now(),
// 	}
//
// 	insertQuery := `INSERT INTO transactions (user_id, account_id, description, amount, type, date, category_id, is_categorized) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
//
// 	var insertedID uuid.UUID
// 	err = db.GetDB().QueryRow(insertQuery,
// 		newTransaction.UserID, newTransaction.AccountID, newTransaction.Description, newTransaction.Amount,
// 		newTransaction.Type, newTransaction.Date, utils.UUIDPtrToNullString(newTransaction.CategoryID), newTransaction.IsCategorized,
// 	).Scan(&insertedID)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to insert automated transaction into DB")
// 		http.Error(w, "Failed to record transaction", http.StatusInternalServerError)
// 		return
// 	}
//
// 	config.Log.WithField("transactionID", insertedID).WithField("source", reqPayload.Source).Info("Automated transaction imported successfully.")
// 	json.NewEncoder(w).Encode(map[string]string{"message": "Transaction recorded successfully", "transaction_id": insertedID.String()})
// }

// // CreateRecurringTransaction handles creating a new recurring transaction.
// func CreateRecurringTransaction(w http.ResponseWriter, r *http.Request) {
// 	userID, err := middleware.GetUserIDFromContext(r.Context())
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
//
// 	var rt models.RecurringTransaction
// 	if err := json.NewDecoder(r.Body).Decode(&rt); err != nil {
// 		http.Error(w, "Invalid request body", http.StatusBadRequest)
// 		return
// 	}
//
// 	// Validate AccountID belongs to UserID
// 	var count int
// 	err = db.GetDB().QueryRow("SELECT COUNT(*) FROM accounts WHERE id = $1 AND user_id = $2", rt.AccountID, userID).Scan(&count)
// 	if err != nil || count == 0 {
// 		http.Error(w, "Invalid account ID or unauthorized access to account", http.StatusBadRequest)
// 		return
// 	}
//
// 	rt.UserID = userID
// 	rt.CreatedAt = time.Now()
// 	rt.UpdatedAt = time.Now()
//
// 	query := `INSERT INTO recurring_transactions (user_id, account_id, description, amount, type, category_id, frequency, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at`
//
// 	categoryIDNull := utils.UUIDPtrToNullString(rt.CategoryID)
// 	endDateNull := utils.TimePtrToNullTime(rt.EndDate)
//
// 	err = db.GetDB().QueryRow(query,
// 		rt.UserID, rt.AccountID, rt.Description, rt.Amount, rt.Type, categoryIDNull, rt.Frequency, rt.StartDate, endDateNull,
// 	).Scan(&rt.ID, &rt.CreatedAt, &rt.UpdatedAt)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to create recurring transaction")
// 		http.Error(w, "Could not create recurring transaction", http.StatusInternalServerError)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(rt)
// }
