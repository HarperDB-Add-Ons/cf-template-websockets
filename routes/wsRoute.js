import fastifyWebsocket from "@fastify/websocket";
import { getNatsConnection, startSubscription } from "../helpers/natsHelper.js";
import { config } from "../helpers/configHelper.js";

const subscriptions = new Map();

export default async (server, { hdbCore, logger }) => {
  // connect to nats
  const nats_connection = await getNatsConnection(config, logger);
  server.get("/hello", {
    handler: async (request, reply) => {
      return "hi";
    },
  });

  // websocket server
  await server.register(fastifyWebsocket);
  server.get("/", { websocket: true }, (connection) => {
    const connection_subscriptions = [];
    connection.socket.on("message", async (data) => {
      const message = JSON.parse(data);
      if (message.action === "subscribe") {
        const { schema, table, id } = message;
        const key = `${schema}.${table}`;
        connection_subscriptions.push([key, id, onPublishedMessage]);
        subscribe(nats_connection, hdbCore, key, id, onPublishedMessage);
      }
      if (message.action === "insert") {
        await hdbCore.requestWithoutAuthentication({
          body: {
            operation: "insert",
            records: [
              {
                clientID,
                action,
              },
            ],
          },
        });
      }
    });
    function onPublishedMessage(message) {
      connection.socket.send(JSON.stringify(message));
    }

    // when closing, remove all listeners created by this connection
    connection.socket.on("close", () => {
      for (const connection_subscription of connection_subscriptions) {
        const [key, id, handler] = connection_subscription;
        const subscription = subscriptions.get(key);
        subscription[id].splice(subscription[id].indexOf(handler), 1);
      }
    });
  });
};

function subscribe(nats_connection, hdbCore, key, id, newListener) {
  const subscription = subscriptions.get(key);
  if (!subscription) {
    subscriptions.set(key, { [id]: [newListener] });
    startSubscription(nats_connection, hdbCore, key, (record) => {
      new Promise((r) => {
        const subscription = subscriptions.get(key);
        if (subscription) {
          const listeners = (subscription[record.id] || []).concat(
            subscription["*"] || []
          );
          for (let listener of listeners) listener(record);
        }
        r();
      });
    });
  } else {
    subscription[id] = (subscription[id] || []).concat(newListener);
  }
}
