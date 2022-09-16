const process = require("process");
const express = require("express");
const crypto = require("crypto");
const app = express();
const port = 8181;

const logger = function (req, res, next) {
  const LOGGING = process.env.LOGGING;

  if (!LOGGING) {
    next();
    return;
  }

  res.on("finish", () => {
    console.log(`${req.method} ${req.path} ${res.statusCode}`);
  });

  let send = res.send;
  res.send = (c) => {
    console.log("RESPONSE BODY: ", c);
    res.send = send;
    return res.send(c);
  };

  next();
};

app.use(express.json());
app.use(logger);

const store = { pipeline: null, application: null };

app.get("/authdomain/authorize", (_, res) => {
  res.redirect("http://localhost:21900/oauth/callback?code=12345");
});

app.post("/authdomain/oauth/token", (_, res) => {
  res.send({
    // Bogus token, nice try ;)
    access_token:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NjMxNzE0MzEsImV4cCI6NDA5MzA4NTA0NiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.Hm4ZyRbey0Z3K0Y1l2yYgHXEwXgFP6nRgMCbRQRzA4s",
    refresh_token: "ah_refreshing",
  });
});

app.post("/v1/applications", (req, res) => {
  const response = {
    created_at: new Date(),
    id: req.params.uuid,
    metadata: req.body.metadata,
    name: req.body.name,
    state: "healthy",
    updated_at: new Date(),
    uuid: req.params.uuid,
  };

  store.application = response;

  res.status(201).send(response);
});

app.get("/v1/applications/:name", (req, res) => {
  if (store.application) {
    res.send(store.application);
  } else {
    res.status(404).send({});
  }
});

app.get("/v1/applications", (req, res) => {
  if (store.application) {
    res.send([store.application]);
  } else {
    res.send([]);
  }
});

app.get("/v1/pipelines/:uuid", (req, res) => {
  res.send({
    created_at: new Date(),
    id: req.params.uuid,
    metadata: { turbine: true, app: "generated" },
    name: "a-pipeline-name",
    state: "healthy",
    updated_at: new Date(),
    uuid: req.params.uuid,
  });
});

app.post("/v1/pipelines", (req, res) => {
  const uuid = crypto.randomUUID();
  const response = {
    uuid,
    name: req.body.name,
    git_sha: req.body.git_sha,
    language: req.body.language,
    pipeline: req.body.pipeline,
  };

  store.pipeline = response;

  res.status(201).send(response);
});

app.post("/v1/connectors", (req, res) => {
  const { resource_id, pipeline_id, name, pipeline_name, metadata, config } =
    req.body;

  const streams = {};

  if (metadata["mx:connectorType"] === "source") {
    streams.output = [config.input];
  } else {
    streams.input = [config.input];
  }

  res.status(201).send({
    config,
    created_at: new Date(),
    environment: {},
    metadata,
    name,
    resource_id,
    pipeline_id,
    pipeline_name,
    state: "pending",
    streams,
    trace: "",
    type: metadata["mx:connectorType"],
    updated_at: new Date(),
    uuid: crypto.randomUUID(),
  });
});

app.post("/v1/functions", (req, res) => {
  const { input_stream, name, image, args, pipeline } = req.body;
  res.status(201).send({
    uuid: crypto.randomUUID(),
    name,
    input_stream,
    output_stream: "output_stream_url",
    image,
    args,
    pipeline,
    status: { state: "pending", details: "" },
  });
});

app.post("/v1/sources", (req, res) => {
  res.status(201).send({
    get_url: "http://localhost:8181/sourcedomain/get",
    put_url: "http://localhost:8181/sourcedomain/put",
  });
});

app.put("/sourcedomain/put", (req, res) => {
  res.send({});
});

app.post("/v1/builds", (req, res) => {
  res.status(201).send({
    uuid: "builduuid",
    status: { state: "" },
  });
});

app.get("/v1/builds/builduuid", (req, res) => {
  res.send({
    uuid: "builduuid",
    status: { state: "complete" },
  });
});

app.get("/v1/resources", (req, res) => {
  res.send([]);
});

app.get("/v1/resources/:id", (req, res) => {
  res.send({
    id: req.params.id,
    type: "pg",
    name: "resource-name",
    url: "a://connection:url/",
    credentials: {},
    metadata: {},
    ssh_tunnel: {},
    environment: {},
    status: { state: "ready", details: "" },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

app.get("/v1/users/me", (req, res) => {
  res.send({
    uuid: crypto.randomUUID(),
    username: "vessel",
    email: "vessel@sleeptoken.com",
    given_name: "vessel",
    family_name: "sleep token",
    verified: true,
    last_login: new Date(),
    features: [],
  });
});

app.post("/v1/telemetry", (req, res) => {
  res.send({});
});

function startServer() {
  return app.listen(port, () => {
    console.log(`Mock server stared on port ${port}`);
    process.send("READY");
  });
}

startServer();
