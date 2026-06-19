package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/rs/zerolog"
)

type Handler struct {
	service   service.Account
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Account, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{
		service,
		validator,
		logger,
	}
}

func (h *Handler) TellerConnect(w http.ResponseWriter, r *http.Request) {
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
			Details:    userID,
		})
		return
	}

	var req accounts.TellerConnectRequest

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

	err = h.service.LinkTeller(ctx, userID, req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Response(w, http.StatusOK, accounts.TellerLinkedMessage, nil, h.logger)
}

func (h *Handler) MonoConnect(w http.ResponseWriter, r *http.Request) {
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
			Details:    userID,
		})
		return
	}

	var req accounts.MonoConnectRequest

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

	err = h.service.LinkMono(ctx, userID, req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Response(w, http.StatusOK, accounts.MonoLinkedMessage, nil, h.logger)
}

// func (h *Handler) MonoWebhook(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
//
// 	var webhook struct {
// 		Event string `json:"event"`
// 		Data  struct {
// 			ID       string `json:"id"`
// 			Customer string `json:"customer"`
// 			Meta     struct {
// 				DataStatus string `json:"data_status"`
// 				AuthMethod string `json:"auth_method"`
// 			} `json:"meta"`
// 			Account *struct {
// 				ID            string  `json:"_id"`
// 				Name          string  `json:"name"`
// 				Currency      string  `json:"currency"`
// 				Type          string  `json:"type"`
// 				AccountNumber string  `json:"accountNumber"`
// 				Balance       float64 `json:"balance"`
// 				Institution   struct {
// 					Name     string `json:"name"`
// 					BankCode string `json:"bankCode"`
// 					Type     string `json:"type"`
// 				} `json:"institution"`
// 				BVN string `json:"bvn"`
// 			} `json:"account"`
// 		} `json:"data"`
// 	}
//
// 	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
// 		respond.Error(respond.ErrorOptions{
// 			W:          w,
// 			R:          r,
// 			StatusCode: http.StatusBadRequest,
// 			ClientErr:  message.ErrBadRequest,
// 			ActualErr:  err,
// 			Logger:     h.logger,
// 			Details:    nil,
// 		})
// 		return
// 	}
//
// 	switch webhook.Event {
// 	case "mono.events.account_connected":
// 		// Account has been linked successfully
// 		h.logger.Info().
// 			Str("account_id", webhook.Data.ID).
// 			Str("customer", webhook.Data.Customer).
// 			Msg("Mono account connected")
//
// 	case "mono.events.account_updated":
// 		// Account data status has been updated
// 		if webhook.Data.Meta.DataStatus == "AVAILABLE" && webhook.Data.Account != nil {
// 			// Data is now available, create the account in our system
// 			err := h.createMonoAccount(ctx, webhook.Data.ID, *webhook.Data.Account)
// 			if err != nil {
// 				h.logger.Error().Err(err).
// 					Str("account_id", webhook.Data.ID).
// 					Msg("Failed to create account from Mono webhook")
// 			}
// 		}
// 	}
//
// 	// Acknowledge webhook
// 	w.WriteHeader(http.StatusOK)
// }
//
// func (h *Handler) createMonoAccount(ctx context.Context, monoAccountID string, monoAccount struct {
// 	ID            string  `json:"_id"`
// 	Name          string  `json:"name"`
// 	Currency      string  `json:"currency"`
// 	Type          string  `json:"type"`
// 	AccountNumber string  `json:"accountNumber"`
// 	Balance       float64 `json:"balance"`
// 	Institution   struct {
// 		Name     string `json:"name"`
// 		BankCode string `json:"bankCode"`
// 		Type     string `json:"type"`
// 	} `json:"institution"`
// 	BVN string `json:"bvn"`
// },
// ) error {
// 	// Find the user associated with this Mono account
// 	connection, err := h.repo.GetConnectionByProviderAccountID(ctx, "mono", monoAccountID)
// 	if err != nil {
// 		return fmt.Errorf("failed to find connection: %w", err)
// 	}
//
// 	// Map Mono account type to your internal account type
// 	accountType, err := mapMonoAccountType(monoAccount.Type)
// 	if err != nil {
// 		return fmt.Errorf("failed to map account type: %w", err)
// 	}
//
// 	// Create account in your system
// 	params := repository.CreateAccountParams{
// 		CreatedBy:         &connection.UserID,
// 		Name:              fmt.Sprintf("%s - %s", monoAccount.Institution.Name, monoAccount.Name),
// 		Type:              accountType,
// 		Balance:           types.Numeric(monoAccount.Balance / 100), // Mono returns balance in kobo/cents
// 		Currency:          monoAccount.Currency,
// 		ProviderAccountID: &monoAccountID,
// 		Provider:          stringPtr("mono"),
// 		AccountNumber:     &monoAccount.AccountNumber,
// 		InstitutionName:   &monoAccount.Institution.Name,
// 		Color:             "blue", // Default color, you might want to make this configurable
// 		Meta: map[string]interface{}{
// 			"mono_account_id":  monoAccount.ID,
// 			"bank_code":        monoAccount.Institution.BankCode,
// 			"institution_type": monoAccount.Institution.Type,
// 			"bvn":              monoAccount.BVN,
// 		},
// 	}
//
// 	var account repository.Account
// 	if monoAccount.Balance == 0 {
// 		account, err = h.repo.CreateAccount(ctx, params)
// 	} else {
// 		account, err = h.repo.CreateAccountWInitalTrs(ctx, params)
// 	}
//
// 	if err != nil {
// 		return fmt.Errorf("failed to create account: %w", err)
// 	}
//
// 	h.logger.Info().
// 		Str("account_id", account.ID).
// 		Str("mono_account_id", monoAccountID).
// 		Str("user_id", connection.UserID).
// 		Msg("Successfully created account from Mono")
//
// 	return nil
// }

// func (h *Handler) PlaidConnect(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
//
// 	userID, err := jwt.GetUserID(r)
// 	if err != nil {
// 		respond.Error(respond.ErrorOptions{
// 			W:          w,
// 			R:          r,
// 			StatusCode: http.StatusInternalServerError,
// 			ClientErr:  message.ErrInternalError,
// 			ActualErr:  err,
// 			Logger:     h.logger,
// 			Details:    userID,
// 		})
// 		return
// 	}
//
// plaidClientID := os.Getenv("PLAID_CLIENT_ID")
// plaidSecret := os.Getenv("PLAID_SECRET")
// if plaidClientID == "" || plaidSecret == "" {
// 	http.Error(w, "Plaid credentials not configured", http.StatusInternalServerError)
// 	return
// }
//
// reqBody := models.CreateLinkTokenRequest{
// 	PlaidClientID: plaidClientID,
// 	PlaidSecret:   plaidSecret,
// 	ClientName:    "Personal Finance Manager", // Your app name
// 	Language:      "en",
// 	CountryCodes:  []string{"US"},
// 	User: struct {
// 		ClientUserID string `json:"client_user_id"`
// 	}{
// 		ClientUserID: userID.String(), // Pass your internal user ID to Plaid
// 	},
// 	Products: []string{"transactions"}, // Or other products like "assets", "investments", "balance"
// }
//
// jsonReqBody, _ := json.Marshal(reqBody)
//
// resp, err := http.Post(getPlaidEnvURL()+"/link/token/create", "application/json", bytes.NewBuffer(jsonReqBody))
// if err != nil {
// 	log.Printf("Error calling Plaid /link/token/create: %v", err)
// 	http.Error(w, "Failed to connect to Plaid", http.StatusInternalServerError)
// 	return
// }
// defer resp.Body.Close()
//
// if resp.StatusCode != http.StatusOK {
// 	bodyBytes, _ := ioutil.ReadAll(resp.Body)
// 	log.Printf("Plaid /link/token/create returned non-OK status: %d, body: %s", resp.StatusCode, string(bodyBytes))
// 	http.Error(w, fmt.Sprintf("Plaid error: %s", string(bodyBytes)), resp.StatusCode)
// 	return
// }
//
// var linkTokenRes models.CreateLinkTokenResponse
// if err := json.NewDecoder(resp.Body).Decode(&linkTokenRes); err != nil {
// 	log.Printf("Error decoding Plaid link token response: %v", err)
// 	http.Error(w, "Failed to parse Plaid response", http.StatusInternalServerError)
// 	return
// }
//
// json.NewEncoder(w).Encode(linkTokenRes)
// }

// TODO: Interesting

// 	if account.PlaidItemID != nil || account.PlaidAccountID != nil {
// 		http.Error(w, "Cannot manually create Plaid-connected accounts via this endpoint", http.StatusBadRequest)
// 		return
// 	}

// 	// Assign shared_finance_id based on active context
// 	if activeContext.Type == "shared" && activeContext.SharedFinanceID != nil {
// 		// Verify user is admin or allowed to add to this shared finance group
// 		// For simplicity: allow any member to add to the shared group they're viewing.
// 		// More robust: query shared_finance_members table for role 'admin'
// 		account.SharedFinanceID = activeContext.SharedFinanceID
// 	} else {
// 		account.SharedFinanceID = nil // Personal account
// 	}
//
// 	query := `INSERT INTO accounts (user_id, name, type, current_balance, currency, shared_finance_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
// 	err = db.GetDB().QueryRow(query,
// 		account.UserID, account.Name, account.Type, account.CurrentBalance, account.Currency,
// 		utils.UUIDPtrToNullString(account.SharedFinanceID),
// 	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Error creating account")
// 		http.Error(w, "Could not create account", http.StatusInternalServerError)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(account)
// }
//
