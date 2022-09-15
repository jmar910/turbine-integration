import child_process, { ChildProcess } from "child_process";
import fs from "fs-extra";
import util from "util";

const execAsync = util.promisify(child_process.exec);

QUnit.module("Meroxa CLI | turbine-js", (hooks) => {
  hooks.before(() => {
    child_process.execSync(
      "meroxa apps init generated --path ./test --lang js"
    );
  });

  hooks.after(() => {
    fs.remove("test/generated");
  });

  QUnit.module("meroxa apps init", (hooks) => {
    QUnit.test("generates the root directory", async (assert) => {
      const checkDir = await fs.pathExists("test/generated");

      assert.ok(checkDir);
    });

    QUnit.test("generates the fixtures", async (assert) => {
      const checkDir = await fs.pathExists("test/generated/fixtures");

      assert.ok(checkDir);
    });

    QUnit.test("installs node_modules", async (assert) => {
      const checkDir = await fs.pathExists("test/generated/node_modules");

      assert.ok(checkDir);
    });
    QUnit.test("copies a gitignore", async (assert) => {
      const checkDir = await fs.pathExists("test/generated/.gitignore");

      assert.ok(checkDir);
    });
  });

  QUnit.module("meroxa apps run", (hooks) => {
    let cliProcess: { stdout: string; stderr: string };
    hooks.before(async () => {
      cliProcess = await execAsync("meroxa apps run --path ./test/generated");
    });

    QUnit.test(
      "executes the data app locally and logs the output",
      async (assert) => {
        assert.ok(
          cliProcess.stdout.includes("===to destination_name resource===")
        );
        assert.ok(
          cliProcess.stdout.toString().includes("customer_email: '~~~")
        );
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
        await execAsync("meroxa login", { timeout: 15000 });

        await execAsync(
          "cd test/generated && git add . && git commit -m 'woooooooo'",
          { timeout: 15000 }
        );

        cliProcess = await execAsync(
          "API_URL=http://localhost:8181/v1 meroxa apps deploy --path ./test/generated",
          { timeout: 15000 }
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
