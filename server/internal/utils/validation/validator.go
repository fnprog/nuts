package validation

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type ValidationError struct {
	Field string `json:"field"`
	Code  string `json:"code"`
}

type ValidationErrors []ValidationError

func (v ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", v.Field, v.Code)
}

func (v ValidationErrors) Error() string {
	if len(v) == 0 {
		return ""
	}

	messages := make([]string, len(v))

	for i, err := range v {
		messages[i] = err.Error()
	}

	return strings.Join(messages, "; ")
}

type Validator struct {
	Validator *validator.Validate
}

func New() *Validator {
	validate := validator.New(validator.WithRequiredStructEnabled())
	return &Validator{
		Validator: validate,
	}
}

// ParseAndValidate parses the request body and validates it
func (v *Validator) ParseAndValidate(r *http.Request, req any) (ValidationErrors, error) {
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, fmt.Errorf("malformed request: %w", err)
	}

	if err := v.Validator.Struct(req); err != nil {
		return ExtractErrors(err), nil
	}

	return nil, nil
}

// ExtractErrors converts validator errors into code-based ValidationErrors
func ExtractErrors(err error) ValidationErrors {
	validationErrors := ValidationErrors{}

	if err == nil {
		return validationErrors
	}

	validErrs, ok := err.(validator.ValidationErrors)
	if !ok {
		return validationErrors
	}

	for _, fieldErr := range validErrs {
		field := strings.ToLower(fieldErr.Field())
		tag := fieldErr.Tag()
		code := fmt.Sprintf("validation.%s", tag)

		validationErrors = append(validationErrors, ValidationError{
			Field: field,
			Code:  code,
		})
	}

	return validationErrors
}

// RegisterCustomValidation registers custom validation functions
func (v *Validator) RegisterCustomValidation(tag string, fn validator.Func) error {
	return v.Validator.RegisterValidation(tag, fn)
}
