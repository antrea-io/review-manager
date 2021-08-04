const core = require('@actions/core');
const github = require('@actions/github');
const inputs = require('./inputs');

try {
    const minApprovingReviewsTotal = core.getInput('min_approving_reviews_total');
    const minApprovingReviewsPerArea = core.getInput('min_approving_reviews_per_area');
    const areaOwnershipFile = core.getInput('area_ownership_file');
    console.log(`Parsing owners file ${areaOwnershipFile}`);
    const areaOwners = inputs.parseOwners(areaOwnershipFile)
    console.log(`Area owners:`, areaOwners)
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}
