// This package helps in forming common Response and Errors
package respond

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/rs/zerolog"
)

type ErrorResponse struct {
	Status string `json:"status"`
	Code   string `json:"code"`
	Errors any    `json:"errors,omitempty"`
}

type SuccessResponse struct {
	Status string `json:"status"`
	Code   string `json:"code,omitempty"`
	Data   any    `json:"data,omitempty"`
}

type ErrorOptions struct {
	W          http.ResponseWriter
	R          *http.Request
	StatusCode int
	ClientErr  error
	ActualErr  error
	Logger     *zerolog.Logger
	Details    any
}

// Error responds with an error code
func Error(opts ErrorOptions) {
	opts.W.Header().Set("Content-Type", "application/json")
	opts.W.WriteHeader(opts.StatusCode)

	response := ErrorResponse{
		Status: "error",
		Code:   opts.ClientErr.Error(),
	}

	opts.Logger.Error().
		Int("status_code", opts.StatusCode).
		Err(opts.ActualErr).
		Interface("details", opts.Details).
		Msg("Error response")

	if err := json.NewEncoder(opts.W).Encode(response); err != nil {
		opts.Logger.Error().
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// Errors responds with an error code and a list of field-level errors (validation)
func Errors(opts ErrorOptions) {
	opts.W.Header().Set("Content-Type", "application/json")
	opts.W.WriteHeader(opts.StatusCode)

	response := ErrorResponse{
		Status: "error",
		Code:   opts.ClientErr.Error(),
		Errors: opts.ActualErr,
	}

	opts.Logger.Error().
		Int("status_code", opts.StatusCode).
		Err(opts.ActualErr).
		Interface("details", opts.Details).
		Msg("Error response")

	if err := json.NewEncoder(opts.W).Encode(response); err != nil {
		opts.Logger.Error().
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// Json responds with raw JSON data and no envelope
func Json(w http.ResponseWriter, statusCode int, data any, logger *zerolog.Logger) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if data == nil {
		_, _ = w.Write([]byte("{}"))
		logger.Debug().Int("status_code", statusCode).Msg("Empty JSON response")
		return
	}

	if err := json.NewEncoder(w).Encode(data); err != nil {
		logger.Error().
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// Response responds with a success code and optional data
func Response(w http.ResponseWriter, statusCode int, code string, data any, logger *zerolog.Logger) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := SuccessResponse{
		Status: "success",
		Code:   code,
		Data:   data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Error().
			Err(err).
			Msg("Failed to encode JSON response")
	}
}

// Status responds with just a status code
func Status(w http.ResponseWriter, statusCode int) {
	w.WriteHeader(statusCode)
}

// IsValidationError checks if the error is a validation error
func IsValidationError(err error) (validation.ValidationErrors, bool) {
	var validationErrors validation.ValidationErrors
	if errors.As(err, &validationErrors) {
		return validationErrors, true
	}
	return nil, false
}
