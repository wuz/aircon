const { create } = require("ipfs");
const fastify = require("fastify")({ logger: true });
const { fastifyFunky } = require("fastify-funky");
const Stream = require("stream");
const path = require("path");
const { Buffer } = require("buffer");
const FileType = require("file-type");

const { extract } = require("it-tar");
const { pipe } = require("it-pipe");
const toBuffer = require("it-to-buffer");
const all = require("it-all");
const map = require("it-map");

let ipfs;

fastify.register(require("fastify-multipart"));
fastify.register(fastifyFunky);
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/", // optional: default '/'
});

async function* tarballed(source) {
  yield* pipe(source, extract(), async function* (source) {
    for await (const entry of source) {
      yield {
        ...entry,
        body: await toBuffer(map(entry.body, (buf) => buf.slice())),
      };
    }
  });
}

async function collect(source) {
  return all(source);
}

const ipfsToFile = async (cid) => await pipe(ipfs.get(cid), tarballed, collect);

// Declare a route
fastify.get("/", async (req, res) => {
  return { hello: "world" };
});

fastify.get("/api/view/:cid", async (req, reply) => {
  const { cid } = req.params;

  const fileData = await ipfsToFile(cid);
  const buffer = Buffer.from(fileData[0].body.buffer);
  const fileType = await FileType.fromBuffer(buffer);
  reply.type(fileType).send(buffer);
});

fastify.post("/api/upload", async (req, reply) => {
  const data = await req.file();
  return data.filename;
});

const start = async () => {
  ipfs = await create();
  try {
    await fastify.listen(4040);
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
