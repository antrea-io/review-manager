const core = require('@actions/core');
const github = require('@actions/github');
const inputs = require('./inputs');
const reviewers = require('./reviewers');
const approval = require('./approval');
const label = require('./label');

let extractLabelNames = function(labels) {
    return labels.map(label => label.name)
}

async function run() {
    try {
        const token = core.getInput('token');
        const minApprovingReviewsTotal = core.getInput('min_approving_reviews_total');
        const minApprovingReviewsPerArea = core.getInput('min_approving_reviews_per_area');
        const areaOwnershipFile = core.getInput('area_ownership_file');
        const failIfMissingApprovingReviews = core.getInput('fail_if_missing_approving_reviews');
        const labelOnSuccess = core.getInput('label_on_success');

        console.log(`Parsing owners file ${areaOwnershipFile}`);
        const areaOwners = inputs.parseOwners(areaOwnershipFile)
        console.log(`Area owners:`, areaOwners)
        const owner = github.context.repo.owner
        const repo = github.context.repo.repo
        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        console.log(`The event payload: ${payload}`);
        const pullRequest = github.context.payload.pull_request
        const labels = extractLabelNames(pullRequest.labels)

        const reviewersList = reviewers.computeReviewers(
            labels,
            pullRequest.user.login,
            areaOwners,
        )
        console.log(`Assigning reviewers:`, reviewersList)
        const pullNumber = pullRequest.number
        await reviewers.requireReviewers(owner, repo, pullNumber, token, reviewersList)

        const approvals = await approval.getApprovals(owner, repo, pullNumber, token)
        console.log(`Currrent approvals: ${approvals}`)
        const canBeMerged = approval.canBeMerged(
            labels,
            approvals,
            areaOwners,
            minApprovingReviewsTotal,
            minApprovingReviewsPerArea,
        )
        console.log(`Checking if PR can be merged: ${canBeMerged}`)

        if (canBeMerged && labelOnSuccess !== '') {
            console.log(`Labelling PR with ${labelOnSuccess}`)
            await label.addLabel(owner, repo, pullNumber, token, labelOnSuccess)
        }

        if (!canBeMerged && failIfMissingApprovingReviews) {
            core.setFailed(`Not enough approving reviews for PR`)
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run()
