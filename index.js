const core = require('@actions/core');
const github = require('@actions/github');
const inputs = require('./inputs');
const reviewers = require('./reviewers');

async function run() {
    try {
        const token = core.getInput('token');
        // const minApprovingReviewsTotal = core.getInput('min_approving_reviews_total');
        // const minApprovingReviewsPerArea = core.getInput('min_approving_reviews_per_area');
        const areaOwnershipFile = core.getInput('area_ownership_file');
        console.log(`Parsing owners file ${areaOwnershipFile}`);
        const areaOwners = inputs.parseOwners(areaOwnershipFile)
        console.log(`Area owners:`, areaOwners)
        const owner = github.context.repo.owner
        const repo = github.context.repo.repo
        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        console.log(`The event payload: ${payload}`);
        const pullRequest = github.context.payload.pull_request
        const reviewersList = reviewers.computeReviewers(pullRequest.labels, pullRequest.user.login, areaOwners)
        console.log(`Assigning reviewers:`, reviewersList)
        const pullNumber = pullRequest.number
        await reviewers.requireReviewers(owner, repo, pullNumber, token, reviewersList)
    } catch (error) {
        core.setFailed(error.message);
    }
}

run()
