const core = require('@actions/core');
const github = require('@actions/github');
const inputs = require('./inputs');
const reviewers = require('./reviewers');
const approval = require('./approval');
const label = require('./label');

let extractLabelNames = function(labels) {
    return labels.map(label => label.name);
};

let getConfig = function() {
    const areaOwnershipFile = core.getInput('area_ownership_file');
    console.log(`Parsing owners file ${areaOwnershipFile}`);
    const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners(areaOwnershipFile);
    console.log(`Maintainers:`, maintainers);
    console.log(`Area reviewers:`, areaReviewers);
    console.log(`Area approvers:`, areaApprovers);
    return {
        minApprovingReviewsTotal: core.getInput('min_approving_reviews_total'),
        minApprovingReviewsPerArea: core.getInput('min_approving_reviews_per_area'),
        maintainers: maintainers,
        areaReviewers: areaReviewers,
        areaApprovers: areaApprovers,
        failIfMissingApprovingReviews: core.getInput('fail_if_missing_approving_reviews'),
        labelOnSuccess: core.getInput('label_on_success'),
        failIfNoAreaLabel: core.getInput('fail_if_no_area_label'),
        succeedIfMaintainerApproves: core.getInput('succeed_if_maintainer_approves'),
        ignoreIfNotLabelledWith: core.getInput('ignore_if_not_labelled_with'),
   };
};

async function run() {
    try {
        const token = core.getInput('token');
        const config = getConfig();

        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2);
        console.log(`The event payload: ${payload}`);
        const pullRequest = github.context.payload.pull_request;
        const labels = extractLabelNames(pullRequest.labels);

        if (config.ignoreIfNotLabelledWith != '' && !labels.includes(config.ignoreIfNotLabelledWith)) {
            return;
        }

        const reviewersList = reviewers.computeReviewers(
            labels,
            pullRequest.user.login,
            config,
        );
        console.log(`Assigning reviewers:`, reviewersList);
        const pullNumber = pullRequest.number;
        await reviewers.requireReviewers(owner, repo, pullNumber, token, reviewersList);

        const approvals = await approval.getApprovals(owner, repo, pullNumber, token);
        console.log(`Currrent approvals: ${approvals}`);
        const canBeMerged = approval.canBeMerged(
            labels,
            approvals,
            config,
        );
        console.log(`Checking if PR can be merged: ${canBeMerged}`);

        if (canBeMerged && config.labelOnSuccess !== '') {
            console.log(`Labelling PR with ${config.labelOnSuccess}`);
            await label.addLabel(owner, repo, pullNumber, token, config.labelOnSuccess);
        }

        if (!canBeMerged && config.failIfMissingApprovingReviews) {
            core.setFailed(`Not enough approving reviews for PR`);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
