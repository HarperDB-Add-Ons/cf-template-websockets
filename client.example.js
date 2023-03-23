import WebSocket from "ws";

const ws = new WebSocket(`ws://127.0.0.1:9926/cf-template-websockets/`);
ws.on("open", () => {
  console.log("open!");
  ws.send(
    JSON.stringify({
      action: "subscribe",
      schema: "dev",
      table: "dog",
      id: "*",
    })
  );
});
ws.on("message", (msg) => {
  console.log("msg", msg.toString());
});
ws.on("error", console.error);
await new Promise((r) => setTimeout(r, 1 << 30));
