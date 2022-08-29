import child_process from "child_process";
import fs from "fs-extra";

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
    let output: Buffer;
    hooks.before(() => {
      output = child_process.execSync(
        "meroxa apps run --path ./test/generated"
      );
    });

    QUnit.test(
      "executes the data app locally and logs the output",
      async (assert) => {
        assert.ok(
          output.toString().includes("===to destination_name resource===")
        );
        assert.ok(output.toString().includes("customer_email: '~~~"));
      }
    );
  });
});
