package user

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
)

type GetUserResponse struct {
	CreatedAt      time.Time                          `json:"created_at"`
	UpdatedAt      time.Time                          `json:"updated_at"`
	Name           *string                            `json:"name"`
	AvatarUrl      *string                            `json:"avatar_url"`
	Email          string                             `json:"email"`
	LinkedAccounts *[]repository.GetLinkedAccountsRow `json:"linked_accounts"`
	MfaEnabled     bool                               `json:"mfa_enabled"`
	HasPassword    bool                               `json:"has_password"`
}

type UpdateUserRequest struct {
	Email    string  `json:"email"`
	Name     *string `json:"name"`
	Password *string `json:"password"`
}

type UpdateUserPreferencesReq struct {
	Currency          *string `json:"currency"`
	Locale            *string `json:"locale"`
	Theme             *string `json:"theme"`
	Timezone          *string `json:"timezone"`
	TimeFormat        *string `json:"time_format"`
	DateFormat        *string `json:"date_format"`
	StartWeekOnMonday *bool   `json:"start_week_on_monday"`
	DarkSidebar       *bool   `json:"dark_sidebar"`
}
