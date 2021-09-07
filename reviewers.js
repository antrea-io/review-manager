const github = require('@actions/github');

let computeReviewers = function(labels, author, areaOwners) {
    const reviewers = new Set()
    labels.forEach(label => {
        const owners = areaOwners.get(label)
        if (owners === undefined) {
            return
        }
        owners.forEach(owner => reviewers.add(owner))
    })
    reviewers.delete(author)
    return Array.from(reviewers)
}

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
    } catch(err) {
        console.log(`cannot assign reviewers: ${err}`)
        throw err
    }
}

exports.computeReviewers = computeReviewers;
exports.requireReviewers = requireReviewers;
