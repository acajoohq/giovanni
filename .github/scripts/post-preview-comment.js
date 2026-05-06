// @ts-nocheck
// Post/update a Cloudflare Worker preview comment + PR description line.
// Uses github-script@v7 globals: github, context, core, process.

const COMMENT_MARKER = "<!-- pdfly-cf-worker-preview -->";
const PR_MARKER = "<!-- pdfly-cf-preview -->";
const BOT_LOGIN = "github-actions[bot]";

/**
 * @returns {{ vid: string; previewUrl: string; aliasUrl: string; sha: string }}
 */
function readEnv() {
    const env = (key) => (process.env[key] ?? "").trim();
    const cmdOut = env("COMMAND_OUTPUT");
    const pick = (re) => cmdOut.match(re)?.[1]?.trim() ?? "";

    return {
        vid: env("VERSION_ID") || pick(/Worker Version ID:\s*(\S+)/i),
        previewUrl: env("DEPLOYMENT_URL") || pick(/Version Preview URL:\s*(\S+)/i),
        aliasUrl: env("DEPLOYMENT_ALIAS_URL") || pick(/Version Preview Alias URL:\s*(\S+)/i),
        sha: env("SOURCE_SHA"),
    };
}

/**
 * @param {{ vid: string; previewUrl: string; aliasUrl: string; sha: string }} params
 * @returns {{ body: string; shortSha: string }}
 */
function buildCommentBody({ vid, previewUrl, aliasUrl, sha }) {
    const { owner, repo } = context.repo;
    const shortSha = sha ? sha.substring(0, 7) : "";
    const shaCell = shortSha ? `[\`${shortSha}\`](https://github.com/${owner}/${repo}/commit/${sha})` : "—";
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;

    const idCell = vid ? `\`${vid.replace(/`/g, "'")}\`` : "—";
    const previewCell = previewUrl ? `[Open Last Commit Preview](${previewUrl})` : "—";
    const aliasCell = aliasUrl ? `[Open PR Preview](${aliasUrl})` : "—";

    const body =
        !vid && !previewUrl && !aliasUrl
            ? `${COMMENT_MARKER}\n\n> **Worker preview** — CI did not report a version or URLs. Run: ${runUrl}\n`
            : [
                  COMMENT_MARKER,
                  "",
                  "### ☁️ Worker preview",
                  "",
                  `Deployed from ${shaCell}`,
                  "",
                  "From the latest successful **versions upload** on this PR:",
                  "",
                  `| 🔖 Version | 🌐 This upload | 📌 Stable preview |`,
                  `| :--- | :--- | :--- |`,
                  `| ${idCell} | ${previewCell} | ${aliasCell} |`,
                  "",
              ].join("\n");

    return { body, shortSha };
}

async function upsertComment(markdownBody) {
    const { owner, repo, number: issueNumber } = context.issue;

    const comments = await github.paginate(github.rest.issues.listComments, {
        owner,
        repo,
        issue_number: issueNumber,
    });

    const ours = comments.filter((c) => c.user?.login === BOT_LOGIN && typeof c.body === "string" && c.body.includes(COMMENT_MARKER));

    const existing = ours.length > 0 ? ours.reduce((a, b) => (a.id > b.id ? a : b)) : null;

    if (existing) {
        await github.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existing.id,
            body: markdownBody,
        });
    } else {
        await github.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: markdownBody,
        });
    }
}

async function upsertPrDescription({ aliasUrl, previewUrl, shortSha, sha }) {
    if (!aliasUrl && !previewUrl) return;

    const { owner, repo, number: pullNumber } = context.issue;
    const prLink = aliasUrl || previewUrl;
    const prLine = `${PR_MARKER}\n☁️ **Preview:** [Open](${prLink}) · [\`${shortSha}\`](https://github.com/${owner}/${repo}/commit/${sha})\n`;

    const pr = await github.rest.pulls.get({ owner, repo, pull_number: pullNumber });
    const currentBody = pr.data.body || "";
    const markerIdx = currentBody.indexOf(PR_MARKER);

    let newBody;
    if (markerIdx !== -1) {
        newBody = currentBody.substring(0, markerIdx).trimEnd();
        const after = currentBody.substring(markerIdx).split("\n").slice(2).join("\n").trimStart();
        newBody += "\n\n" + prLine + "\n" + after;
    } else {
        newBody = currentBody.trimEnd() + "\n\n" + prLine;
    }

    await github.rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        body: newBody.trimEnd(),
    });
}

async function main() {
    const env = readEnv();
    const { body: commentBody, shortSha } = buildCommentBody(env);

    await upsertComment(commentBody);
    await upsertPrDescription({ ...env, shortSha });
}

await main();
