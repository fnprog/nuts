package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/pkg/router"
)

func RegisterHTTPHandlers() http.Handler {
	router := router.NewRouter()

	return router
}
