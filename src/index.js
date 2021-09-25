const fastify = require("fastify")({ logger: true });
const { fastifyFunky } = require("fastify-funky");
const formidable = require("formidable");
const path = require("path");

fastify.register(fastifyFunky);
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/" // optional: default '/'
});

// Declare a route
fastify.get("/", async (req, res) => {
  return { hello: "world" };
});

fastify.post("/api/upload", async (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, (err, fields, files) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ fields, files }, null, 2));
  });

  return;
});

const start = async () => {
  try {
    await fastify.listen(8080);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

// TODO: Add post route
// TODO: Add authentication
// TODO: Add ipfs storage & database
// TODO: Add payment processing
