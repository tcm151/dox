import { readFileSync } from "node:fs";

const version = process.argv[2];

if (!/^\d{4}\.\d+\.\d+$/.test(version ?? "")) {
    console.error("Usage: node scripts/extract-release-notes.mjs <year.major.patch>");
    process.exit(2);
}

const lines = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n");
const matches = [];

for (let index = 0; index < lines.length; index += 1) {
    const heading = /^## \[(\d{4}\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/.exec(lines[index]);
    if (heading?.[1] === version) matches.push(index);
}

if (matches.length !== 1) {
    console.error(`Expected one dated CHANGELOG.md section for ${version}; found ${matches.length}.`);
    process.exit(1);
}

const start = matches[0];
const nextSection = lines.findIndex((line, index) => index > start && /^## /.test(line));
const section = lines.slice(start, nextSection < 0 ? lines.length : nextSection).join("\n").trim();

if (!section.split("\n").slice(1).some(line => line.trim())) {
    console.error(`CHANGELOG.md section for ${version} is empty.`);
    process.exit(1);
}

process.stdout.write(`${section}\n`);