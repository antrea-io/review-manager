const github = require('@actions/github');
const owners = require('./owners');

let computeReviewers = function(labels, author, config) {
    const reviewers = new Set();
    labels.forEach(label => {
        const r1 = owners.labelToOwners(label, config.areaReviewers, config.areaReviewersRegexList);
        const r2 = owners.labelToOwners(label, config.areaApprovers, config.areaApproversRegexList);
        r1.forEach(reviewer => reviewers.add(reviewer));
        r2.forEach(reviewer => reviewers.add(reviewer));
    });
    reviewers.delete(author);
    return Array.from(reviewers);
};

async function requireReviewers(owner, repo, pullNumber, token, reviewers) {
    // const octokit = github.getOctokit(token, {log: console});
    const octokit = github.getOctokit(token, {log: require("console-log-level")({ level: "debug" })});

    console.log(
      JSON.stringify({
        owner: owner,
        repo: repo,
        pull_number: pullNumber,
        reviewers: reviewers,
      })
    );

    try {
        await octokit.rest.pulls.requestReviewers({
            owner: owner,
            repo: repo,
            pull_number: pullNumber,
            reviewers: reviewers,
        });
    } catch(error) {
        console.log(`cannot assign reviewers: ${error}`);
        throw error;
    }
}

exports.computeReviewers = computeReviewers;
exports.requireReviewers = requireReviewers;
