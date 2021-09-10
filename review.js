const github = require('@actions/github');
const owners = require('./owners');

let computeReviewers = function(labels, author, config) {
    const reviewers = new Set();
    labels.forEach(label => {
        const r1 = owners.labelToOwners(label, author, config.areaReviewers, config.areaReviewersRegexList);
        const r2 = owners.labelToOwners(label, author, config.areaApprovers, config.areaApproversRegexList) || [];
        if (r1 != undefined) { // known area label
            r1.forEach(reviewer => reviewers.add(reviewer));
            if (r2.length < config.minApprovingReviewsPerArea && config.requestReviewsFromMaintainersIfNeeded) {
                console.log(`There are not enough approvers for label ${label}, using maintainers as requested`);
                const maintainers = config.maintainers.filter(maintainer => maintainer !== author);
                maintainers.forEach(maintainer => reviewers.add(maintainer));
            }
        }
        r2.forEach(reviewer => reviewers.add(reviewer));
    });
    // should not be needed
    reviewers.delete(author);
    return Array.from(reviewers);
};

async function requestReviewers(owner, repo, pullNumber, token, reviewers) {
    // const octokit = github.getOctokit(token, {log: console});
    const octokit = github.getOctokit(token, {log: require("console-log-level")({ level: "debug" })});

    console.log(
        "request reviewers",
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
        console.log(`cannot request reviewers: ${error}`);
        throw error;
    }
}

exports.computeReviewers = computeReviewers;
exports.requestReviewers = requestReviewers;
