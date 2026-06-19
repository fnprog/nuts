FROM golang:1.23-alpine AS src

WORKDIR /go/src/app/

COPY go.mod go.sum ./
RUN go mod download

COPY server/ ./server/

ENV CGO_ENABLED=0
ENV GOOS=linux

RUN go build -a -ldflags="-s -w" -o ./server-binary ./server/cmd/api/main.go && \
  go build -a -ldflags="-s -w" -o ./healthcheck-binary ./server/cmd/health/main.go


# PHASE 2
FROM gcr.io/distroless/static-debian12:nonroot

LABEL com.example.maintainers="Rich <ridy@example.com>"

WORKDIR /usr/bin/local

COPY --from=src /go/src/app/server/locales /usr/bin/local/locales
COPY --from=src /go/src/app/server-binary /usr/bin/local/server
COPY --from=src /go/src/app/healthcheck-binary /usr/bin/local/healthcheck

ARG API_PORT
ENV API_PORT=${API_PORT}

EXPOSE ${API_PORT}

ENTRYPOINT ["/usr/bin/local/server"]
