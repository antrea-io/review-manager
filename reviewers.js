const github = require('@actions/github');

let computeReviewers = function(labels, author, config) {
    const reviewers = new Set();
    labels.forEach(label => {
        let reviewersForArea = config.areaReviewers.get(label) || [];
        reviewersForArea = reviewersForArea.concat(config.areaApprovers.get(label) || []);
        reviewersForArea.forEach(reviewer => reviewers.add(reviewer));
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
