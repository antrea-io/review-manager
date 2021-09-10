const github = require('@actions/github');
const owners = require('./owners');

async function getApprovals(owner, repo, pullNumber, token) {
    const octokit = github.getOctokit(token);
    const approvals = new Set();

    try {
        for await (const res of octokit.paginate.iterator(octokit.rest.pulls.listReviews, {
            owner: owner,
            repo: repo,
            pull_number: pullNumber,
            per_page: 100,
        })) {
            res.data.forEach(review => {
                if (review.state === 'APPROVED') {
                    approvals.add(review.user.login);
                }
            });
        }
    } catch(error) {
        console.log(`cannot determine approvals: ${error}`);
        throw error;
    }

    return approvals;
}

let canBeMerged = function(labels, author, approvals, config) {
    var hasMaintainerApproval = false;
    config.maintainers.forEach(maintainer => {
        if (approvals.has(maintainer)) {
            hasMaintainerApproval = true;
        }
    });
    if (hasMaintainerApproval && config.succeedIfMaintainerApproves) {
        console.log(`PR was approved by maintainer`);
        return true;
    }

    // Maps area label to [<num approvals for area>, <max num approvers for area>]
    const approvalsByArea = new Map();
    labels.forEach(label => {
        const reviewersForArea = owners.labelToOwners(label, author, config.areaReviewers, config.areaReviewersRegexList);
        let approversForArea = owners.labelToOwners(label, author, config.areaApprovers, config.areaApproversRegexList) || [];
        const maintainers = config.maintainers.filter(maintainer => maintainer !== author);

        if (reviewersForArea !== undefined && approversForArea.length < config.minApprovingReviewsPerArea && config.requestReviewsFromMaintainersIfNeeded) {
            console.log(`There are not enough approvers for label ${label}, using maintainers as requested`);
            maintainers.forEach(maintainer => approversForArea.push(maintainer));
        }

        if (config.maintainersAreUniversalApprovers) {
            maintainers.forEach(maintainer => approversForArea.push(maintainer));
        }

        let approvalsForArea = [];
        approversForArea.forEach(approver => {
            if (approvals.has(approver)) {
                approvalsForArea.push(approver);
            }
        });
        approvalsByArea.set(label, [approvalsForArea.length, approversForArea.length]);
    });

    console.log(`Approvals: ${Array.from(approvals)}`);
    console.log(`Approvals by area: ${JSON.stringify(Array.from(approvalsByArea))}`);

    var result = true;

    if (approvals.size < config.minApprovingReviewsTotal) {
        console.log(`Insufficient number of approvals: expected ${config.minApprovingReviewsTotal} but got ${approvals.size}`);
        result = false;
    }

    if (approvalsByArea.size < 1 && config.requireAreaLabel) {
        console.log(`At least one area label is required for a pull request`);
        result = false;
    }

    approvalsByArea.forEach(function(approvals, area) {
        const numApprovals = approvals[0];
        const maxApprovers = approvals[1];
        if (maxApprovers < config.minApprovingReviewsPerArea) {
            console.warn(`Area label ${area} does not have enough approvers to satisfy min requirement`);
        }
        if (numApprovals < config.minApprovingReviewsPerArea) {
            if (config.failIfNotEnoughAvailableApproversPerArea || numApprovals < maxApprovers) {
                console.log(`Not enough approvals for area ${area}: expected ${config.minApprovingReviewsPerArea} but got ${numApprovals}`);
                result = false;
            }
        }
    });

    return result;
};

exports.getApprovals = getApprovals;
exports.canBeMerged = canBeMerged;
