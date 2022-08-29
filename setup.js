const tsNode = require("ts-node");

tsNode.register({
  files: true,
  transpileOnly: true,
  project: "tsconfig.json",
});
