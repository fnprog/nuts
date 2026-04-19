{ pkgs,  ... }:

{
  packages = [
    pkgs.git
    pkgs.eas-cli
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-slim_24;
    pnpm.enable = true;
    npm.enable = true;
  };

  languages.rust = {
    enable = true;
  };

  processes = {
    web-client.exec = "cd apps/client && pnpm run dev";
    go-server.exec = "cd server && air";
    ai-service.exec = "cd services/ai && uv run uvicorn app.main:app --port 8000";
  };
}
