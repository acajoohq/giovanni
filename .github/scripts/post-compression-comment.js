// @ts-nocheck
// Post/update a compression summary comment on the PR.
// Uses github-script@v7 globals: github, context, core, process.

const fs = require("fs");
const path = require("path");

const COMMENT_MARKER = "<!-- pdfly-compression-summary -->";
const BOT_LOGIN = "github-actions[bot]";
const SUMMARY_PATH = path.join(process.env.GITHUB_WORKSPACE, "packages/pdfly-wasm/test-report/compression-summary.md");

function buildCommentBody() {
    if (!fs.existsSync(SUMMARY_PATH)) {
        core.warning("compression-summary.md not found, skipping PR comment.");
        return null;
    }

    const summary = fs.readFileSync(SUMMARY_PATH, "utf8").trim();
    return [COMMENT_MARKER, "", summary].join("\n");
}

async function upsertComment(body) {
    const { owner, repo, number: issueNumber } = context.issue;

    const comments = await github.paginate(github.rest.issues.listComments, {
        owner,
        repo,
        issue_number: issueNumber,
    });

    const existing = comments
        .filter((c) => c.user?.login === BOT_LOGIN && c.body?.includes(COMMENT_MARKER))
        .reduce((latest, c) => (!latest || c.id > latest.id ? c : latest), null);

    if (existing) {
        await github.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existing.id,
            body,
        });
        core.info(`Updated compression comment #${existing.id}`);
    } else {
        await github.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body,
        });
        core.info("Created compression comment");
    }
}

const body = buildCommentBody();
if (body) await upsertComment(body);
