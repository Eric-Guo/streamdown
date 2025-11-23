import { promises as fs } from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

const injectUseClientDirective = async () => {
  const distDir = path.resolve(process.cwd(), "dist");
  const entries = await fs.readdir(distDir);
  const targets = entries.filter(
    (file) => file.endsWith(".js") || file.endsWith(".cjs")
  );

  await Promise.all(
    targets.map(async (file) => {
      const fullPath = path.join(distDir, file);
      const content = await fs.readFile(fullPath, "utf8");
      if (
        content.startsWith('"use client";') ||
        content.startsWith("'use client'")
      ) {
        return;
      }
      await fs.writeFile(fullPath, `"use client";\n${content}`, "utf8");
    })
  );
};

export default defineConfig({
  dts: true,
  entry: ["index.tsx"],
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom"],
  treeshake: true,
  splitting: true,
  clean: true,
  platform: "browser",
  async onSuccess() {
    await injectUseClientDirective();
  },
});
