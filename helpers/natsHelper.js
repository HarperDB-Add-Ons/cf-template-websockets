import { connect, consumerOpts, createInbox } from "nats";
import { unpack } from "msgpackr";
import { v4 as uuidv4 } from "uuid";

const MAX_RETRIES = 5;

export const getNatsConnection = async (config, logger) => {
  for (let retries = 0; retries < MAX_RETRIES; retries++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return await connect({
        name: config.nats.host,
        port: config.nats.port,
        user: config.nats.user,
        pass: config.nats.pass,
        maxReconnectAttempts: -1,
        tls: {
          keyFile: config.certs.keyFile,
          certFile: config.certs.certFile,
          caFile: config.certs.caFile,
          insecure: true,
        },
      });
    } catch (error) {
      logger.error("Connecting to NATS: " + error.message);
      console.error("encountered nats error", error);
    }
  }
  throw new Error("Unable to connect to NATs");
};

export const startSubscription = async (
  nats_connection,
  hdbCore,
  key,
  handler
) => {
  const jet_stream = nats_connection.jetstream();

  // get node name
  const { node_name } = await hdbCore.requestWithoutAuthentication({
    body: {
      operation: "cluster_status",
    },
  });

  const subject = `txn.${key}.${node_name}-leaf`;

  const opts = consumerOpts();
  opts.durable(uuidv4());
  opts.manualAck();
  opts.ackExplicit();
  opts.deliverTo(createInbox());
  opts.startAtTimeDelta(0);

  try {
    let sub = await jet_stream.subscribe(subject, opts);
    const done = (async () => {
      for await (const m of sub) {
        m.ack();
        new Promise((r) => {
          let data = unpack(m.data);
          for (let record of data.records) {
            handler(record);
          }
        });
      }
    })();
  } catch (error) {
    console.log("error", error);
  }
};
