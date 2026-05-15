import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const sourceDir = ".claude/agents";
const targetDir = ".codex/agents";

const roleByAgent = {
  lead: "default",
  designer: "worker",
  plumber: "worker",
  backend: "worker",
  frontend: "worker",
  tester: "worker",
  launcher: "worker",
  deployer: "worker",
  scribe: "worker",
};

const normalizeText = (text) =>
  text
    .replaceAll("\u2014", " - ")
    .replaceAll("\u2013", " - ")
    .replaceAll("Claude Code", "Codex")
    .replaceAll("CLAUDE.md", "AGENTS.md")
    .replaceAll(".claude/agents/", ".codex/agents/");

const parseFrontmatter = (text) => {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  return match ? [match[1], match[2]] : ["", text];
};

const parseYamlLines = (frontmatter) =>
  Object.fromEntries(
    frontmatter
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf(":");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );

await mkdir(targetDir, { recursive: true });
await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith(".md"))
  .sort();

for (const file of files) {
  const sourcePath = join(sourceDir, file);
  const targetPath = join(targetDir, file);
  const source = await readFile(sourcePath, "utf8");
  const [frontmatter, body] = parseFrontmatter(source);
  const metadata = parseYamlLines(frontmatter);
  const name = metadata.name ?? basename(file, ".md");
  const codexRole = roleByAgent[name] ?? "worker";
  const description = normalizeText(metadata.description ?? "");
  const normalizedBody = normalizeText(body).trimEnd();

  await writeFile(
    targetPath,
    [
      "---",
      `name: ${name}`,
      `description: ${description}`,
      `codex_role: ${codexRole}`,
      "source: .claude/agents/" + file,
      "---",
      "",
      "> Generated from `.claude/agents/" +
        file +
        "` by `scripts/sync-codex-agents.mjs`. Edit the Claude agent and rerun `npm run agents:sync`.",
      "",
      normalizedBody,
      "",
    ].join("\n"),
  );
}

console.log(`Synced ${files.length} agents to ${targetDir}`);
