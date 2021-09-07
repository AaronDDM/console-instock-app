# Console In-stock Checker (App)

## Requirements
1. AWS SAM CLI
2. Node 14+

## Installation
1. Start by going into `cd /purchaser/
2. Run `npm ci`
3. Then `cd ../stock-scanner/`
4. Run `npm ci`
   

## Deploy
1. Copy `samcomfig.toml.sample` to `samconfig.toml` via `cp samconfig.toml.sample samconfig.toml`
2. Modify the file and replace all teh place holders
3. Then run `make build`
4. Then run `make deploy`