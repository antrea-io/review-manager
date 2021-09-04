const github = require('@actions/github');

let computeReviewers = function(labels, areaOwners) {
    const reviewers = new Set()
    labels.forEach(label => {
        const owners = areaOwners.get(label.name)
        if (owners === undefined) {
            return
        }
        owners.forEach(owner => reviewers.add(owner))
    })
    return Array.from(reviewers)
}

async function requireReviewers(owner, repo, pullNumber, token, reviewers) {
    // const octokit = github.getOctokit(token, {log: console});
    const octokit = github.getOctokit(token, {log: require("console-log-level")({ level: "info" })});

    try {
        await octokit.rest.pulls.requestReviewers({
            owner: owner,
            repo: repo,
            pull_number: pullNumber,
            reviewers: reviewers,
        });
    } catch(err) {
        if (err.status === 404) {
            throw new Error("Cannot assign reviewers")
        }
        throw err;
    }
}

exports.computeReviewers = computeReviewers;
exports.requireReviewers = requireReviewers;
