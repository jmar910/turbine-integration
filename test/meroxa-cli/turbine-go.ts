import child_process, { ChildProcess } from "child_process";
import fs from "fs-extra";
import util from "util";

const execAsync = util.promisify(child_process.exec);
const GOPATH = process.env.GOPATH;

QUnit.module("Meroxa CLI | turbine-go", (hooks) => {
  hooks.before(() => {
    child_process.execSync(
      `meroxa apps init generated --path ${GOPATH}/src --lang go`
    );
  });

  hooks.after(() => {
    fs.remove(`${GOPATH}/src/generated`);
  });

  QUnit.module("meroxa apps init", (hooks) => {
    QUnit.test("generates the root directory", async (assert) => {
      const checkDir = await fs.pathExists(`${GOPATH}/src/generated`);

      assert.ok(checkDir);
    });

    QUnit.test("generates the fixtures", async (assert) => {
      const checkDir = await fs.pathExists(`${GOPATH}/src/generated/fixtures`);

      assert.ok(checkDir);
    });

    QUnit.test("copies a gitignore", async (assert) => {
      const checkDir = await fs.pathExists(
        `${GOPATH}/src/generated/.gitignore`
      );

      assert.ok(checkDir);
    });
  });

  QUnit.module("meroxa apps run", (hooks) => {
    let cliProcess: { stdout: string; stderr: string };
    hooks.before(async () => {
      cliProcess = await execAsync(
        `meroxa apps run --path ${GOPATH}/src/generated`
      );
    });

    QUnit.test(
      "executes the data app locally and logs the output",
      async (assert) => {
        assert.ok(cliProcess.stdout.includes("===to destination_name"));
        assert.ok(cliProcess.stdout.includes("3 record(s) written"));
      }
    );
  });
  QUnit.module("meroxa apps deploy", (hooks) => {
    let serverProcess: ChildProcess;
    let cliProcess: { stdout: string; stderr: string };

    hooks.before(async () => {
      serverProcess = child_process.fork("server.js");

      await new Promise((resolve) => {
        serverProcess.on("message", (data) => {
          if (data === "READY") {
            resolve(1);
          }
        });
      });

      try {
        child_process.exec("meroxa login", (err, stdout, stderr) => {
          if (err) {
            console.error(`exec error: ${err}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        });
        await execAsync(
          `cd ${GOPATH}/src/generated && git add . && git commit -m 'wooooooo'`
        );
        cliProcess = await execAsync(
          `API_URL=http://localhost:8181/v1 meroxa apps deploy --path ${GOPATH}/src/generated`
        );
        console.log(cliProcess.stdout);
      } catch (e) {
        console.log(e);
      }
    });

    hooks.after(async () => {
      serverProcess.kill();
    });

    QUnit.test("successfully deploys the app", (assert) => {
      assert.ok(
        cliProcess.stdout.includes(
          `Application "generated" successfully created!`
        )
      );
      assert.ok(cliProcess.stdout.includes(`To visualize your application`));
    });
  });
});
