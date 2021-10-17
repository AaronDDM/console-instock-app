# Console In-stock Checker (App)

## Requirements
1. AWS SAM CLI
2. Node 14+

## Installation
1. Run `make install`
2. Build `make build` or `make build-manual`
## Test
1. Use node to call the lambda handler via: `node -e 'require("./stock-scanner/.build/index").handler()'`
2. Use node to call the manual file: `node ./stock-scanner/.build-manual/index` - be sure to set your environment variables for `DISCORD_NOTIFICATION_URL` and `DISCORD_BOT_STATUS_CHECK_URL`.
## Deploy
1. Copy `samcomfig.toml.sample` to `samconfig.toml` via `cp samconfig.toml.sample samconfig.toml`
2. Modify the file and replace all teh place holders
3. Then run `make build_deploy`