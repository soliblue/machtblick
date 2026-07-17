import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const sourceDir = ".claude/agents";
const targetDir = ".codex/agents";

const normalizeText = (text) =>
  text
    .replaceAll("\u2014", " - ")
    .replaceAll("\u2013", " - ")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u2192", "->")
    .replaceAll("Claude Code", "Codex")
    .replaceAll("CLAUDE.md", "AGENTS.md")
    .replaceAll(".claude/agents/", ".codex/agents/");

const tomlString = (value) => JSON.stringify(value);

const tomlMultilineString = (value) => {
  if (value.includes("'''")) {
    throw new Error("TOML literal multiline strings cannot contain triple single quotes");
  }

  return `'''\n${value}\n'''`;
};

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
  const nameFromFile = basename(file, ".md");
  const targetPath = join(targetDir, `${nameFromFile}.toml`);
  const source = await readFile(sourcePath, "utf8");
  const [frontmatter, body] = parseFrontmatter(source);
  const metadata = parseYamlLines(frontmatter);
  const name = metadata.name ?? nameFromFile;
  const description = normalizeText(metadata.description ?? "");
  const developerInstructions = [
    `Generated from .claude/agents/${file} by scripts/sync-codex-agents.mjs. Edit the Claude agent and rerun npm run agents:sync.`,
    "",
    "Codex role mapping: worker.",
    "",
    normalizeText(body).trimEnd(),
  ].join("\n");

  await writeFile(
    targetPath,
    [
      `name = ${tomlString(name)}`,
      `description = ${tomlString(description)}`,
      `developer_instructions = ${tomlMultilineString(developerInstructions)}`,
      "",
    ].join("\n"),
  );
}

await copyFile("AGENTS.md", "CLAUDE.md");

console.log(`Synced ${files.length} agents to ${targetDir} and mirrored AGENTS.md to CLAUDE.md`);
