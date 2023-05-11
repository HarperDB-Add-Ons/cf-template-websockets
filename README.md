# CF-Template-WebSockets

[HarperDB's](https://www.harperdb.io/) WebSocket Custom Function to connect to the internal [NATS.io](https://nats.io/) stream and subscribe to real-time database transactions.

## Setup

1. Create a HarperDB Instance with Clustering Enabled
2. Clone this repo to the $hdb/custom_functions directory of your HarperDB instance.
3. Copy config.json.example to config.json and update the params to match your environment (cert locations and cluster username)
4. Run `npm install`
5. Restart the CF

## Schema

Ensure that the database schema and tables are created before subscribing to a schema.table pattern.

## Subscribe

1. Connect to the WebSocket server running at $hdb_cf_host/cf-template-websockets (by default this would be http://localhost:9926/cf-template-websockets if it's running locally)
2. Subscribe to a stream with a message like:

```
{
  action: "subscribe",
  schema: "dev",
  table: "dog",
  id: "*",
}
```

The id can be one matching a record (it's okay to subscribe to a specific record before it exists) or '\*' which will subscribe to all record transactions on the given schema and table

### Example Client

There's an example client in the repo (client.example.js) that can be used as a starting point for subscribing.
