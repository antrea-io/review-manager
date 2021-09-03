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
    const octokit = github.getOctokit(token);

    return octokit.rest.pulls.requestReviewers({
        owner: owner,
        repo: repo,
        pull_number: pullNumber,
        reviewers: reviewers,
    });
}

exports.computeReviewers = computeReviewers;
exports.requireReviewers = requireReviewers;
