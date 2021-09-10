const core = require('@actions/core');
const github = require('@actions/github');
const inputs = require('./inputs');
const review = require('./review');
const approval = require('./approval');
const label = require('./label');
const owners = require('./owners');

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

    const supportLabelRegex = core.getInput('support_label_regex');
    let areaReviewersRegexList = [];
    let areaApproversRegexList = [];
    if (supportLabelRegex) {
        areaReviewersRegexList = owners.buildRegexList(areaReviewers);
        areaApproversRegexList = owners.buildRegexList(areaApprovers);
    }

    return {
        minApprovingReviewsTotal: core.getInput('min_approving_reviews_total'),
        minApprovingReviewsPerArea: core.getInput('min_approving_reviews_per_area'),
        maintainers: maintainers,
        areaReviewers: areaReviewers,
        areaApprovers: areaApprovers,
        areaReviewersRegexList: areaReviewersRegexList,
        areaApproversRegexList: areaApproversRegexList,
        failIfMissingApprovingReviews: core.getInput('fail_if_missing_approving_reviews'),
        labelOnSuccess: core.getInput('label_on_success'),
        failIfNoAreaLabel: core.getInput('fail_if_no_area_label'),
        succeedIfMaintainerApproves: core.getInput('succeed_if_maintainer_approves'),
        requestReviewsFromMaintainersIfNeeded: core.getInput('request_reviews_from_maintainers_if_needed'),
        ignoreIfNotLabelledWith: core.getInput('ignore_if_not_labelled_with'),
        failIfNotEnoughAvailableApproversPerArea: core.getInput('fail_if_not_enough_available_approvers_for_area'),
        maintainersAreUniversalApprovers: core.getInput('maintainers_are_universal_approvers'),
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
        console.debug(`The event payload: ${payload}`);
        const pullRequest = github.context.payload.pull_request;
        const labels = extractLabelNames(pullRequest.labels);

        if (pullRequest.draft) {
            console.log(`Skipping PR because it is a draft`);
            return;
        }

        if (config.ignoreIfNotLabelledWith != '' && !labels.includes(config.ignoreIfNotLabelledWith)) {
            console.log(`Skipping PR because label ${config.ignoreIfNotLabelledWith} is not present`);
            return;
        }

        const author = pullRequest.user.login;

        const reviewersList = review.computeReviewers(
            labels,
            author,
            config,
        );
        console.log(`Assigning reviewers:`, reviewersList);
        const pullNumber = pullRequest.number;
        await review.requestReviewers(owner, repo, pullNumber, token, reviewersList);

        const approvals = await approval.getApprovals(owner, repo, pullNumber, token);
        console.log(`Currrent approvals: ${approvals}`);
        const canBeMerged = approval.canBeMerged(
            labels,
            author,
            approvals,
            config,
        );
        console.log(`Checking if PR can be merged: ${canBeMerged}`);

        if (config.labelOnSuccess !== '') {
            const hasLabel = labels.includes(config.labelOnSuccess);
            if (canBeMerged) {
                if (hasLabel) {
                    console.log(`PR already labelled with ${config.labelOnSuccess}`);
                } else {
                    console.log(`Labelling PR with ${config.labelOnSuccess}`);
                    await label.addLabel(owner, repo, pullNumber, token, config.labelOnSuccess);
                }
            } else {
                if (hasLabel) {
                    console.log(`Unlabelling PR with ${config.labelOnSuccess}`);
                    await label.removeLabel(owner, repo, pullNumber, token, config.labelOnSuccess);
                } else {
                    console.log(`PR is not labelled with ${config.labelOnSuccess}`);
                }
            }
        }

        if (!canBeMerged && config.failIfMissingApprovingReviews) {
            core.setFailed(`Not enough approving reviews for PR`);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
