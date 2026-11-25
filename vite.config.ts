import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** "/x/node_modules/@scope/pkg/lib/a.js" → "/x/node_modules/@scope/pkg" (innermost package). */
const packageDir = (moduleId: string): string | null => {
  const marker = "/node_modules/";
  const at = moduleId.replaceAll("\\", "/").lastIndexOf(marker);
  if (at < 0) return null;
  const rest = moduleId.slice(at + marker.length).split("/");
  const depth = rest[0]?.startsWith("@") ? 2 : 1;
  return moduleId.slice(0, at + marker.length) + rest.slice(0, depth).join("/");
};

/**
 * Writes dist/THIRD-PARTY-LICENSES.txt with the license text of every npm package that
 * actually ended up in the bundle. The minifier drops license comments, and MIT, ISC,
 * BSD and EPL-2.0 all expect the notice to travel with distributed copies.
 */
const thirdPartyLicenses = (): Plugin => ({
  name: "third-party-licenses",
  apply: "build",
  generateBundle(_, bundle) {
    const dirs = new Set<string>();
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== "chunk") continue;
      for (const id of chunk.moduleIds) {
        const dir = packageDir(id);
        if (dir && existsSync(join(dir, "package.json"))) dirs.add(dir);
      }
    }
    const sections = [...dirs]
      .map((dir) => {
        const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
          name: string;
          version: string;
          license?: string;
          repository?: string | { url?: string };
        };
        const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
        const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
        // Some packages (e.g. react-compiler-runtime) declare a license but ship no file.
        const text = file
          ? readFileSync(join(dir, file), "utf8").trim()
          : `This package ships no license file. Its package.json declares: ${pkg.license ?? "unknown"}.` +
            (repo ? `\nSource and full license: ${repo}` : "");
        return {
          name: pkg.name,
          body: `${pkg.name}@${pkg.version} (${pkg.license ?? "unknown"})\n\n${text}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!sections.length) return;
    const header =
      "Third-party software included in this build. See README.md for details.\n" +
      "elkjs is used unmodified under EPL-2.0; source: https://github.com/kieler/elkjs";
    this.emitFile({
      type: "asset",
      fileName: "THIRD-PARTY-LICENSES.txt",
      source: [header, ...sections.map((s) => s.body)].join(`\n\n${"=".repeat(72)}\n\n`),
    });
  },
});

export default defineConfig({
  plugins: [react(), thirdPartyLicenses()],
  server: { port: 5173 },
});
