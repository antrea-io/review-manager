const github = require('@actions/github');

async function getApprovals(owner, repo, pullNumber, token) {
    const octokit = github.getOctokit(token)
    const approvals = new Set()

    try {
        for await (const res of octokit.paginate.iterator(octokit.rest.pulls.listReviews, {
            owner: owner,
            repo: repo,
            pull_number: pullNumber,
            per_page: 100,
        })) {
            res.data.forEach(review => {
                if (review.state === 'APPROVED') {
                    approvals.add(review.user.login)
                }
            });
        }
    } catch(err) {
        console.log(`cannot determine approvals: ${err}`)
        throw err
    }

    return approvals
}

let canBeMerged = function(
    labels,
    approvals,
    areaOwners,
    minApprovingReviewsTotal,
    minApprovingReviewsPerArea,
) {
    const approvalsByArea = new Map()
    labels.forEach(label => {
        const owners = areaOwners.get(label)
        if (owners === undefined) {
            return
        }
        let approvalsForArea = []
        owners.forEach(owner => {
            if (approvals.has(owner)) {
                approvalsForArea.push(owner)
            }
        })
        approvalsByArea.set(label, approvalsForArea)
    })

    console.log(`Approvals: ${Array.from(approvals)}`)
    console.log(`Approvals by area: ${JSON.stringify(Array.from(approvalsByArea))}`)

    var result = true

    if (approvals.size < minApprovingReviewsTotal) {
        console.log(`Insufficient number of approvals: expected ${minApprovingReviewsTotal} but got ${approvals.size}`)
        result = false
    }

    if (approvalsByArea.size < 1) {
        console.log(`At least one area label is required for a pull request`)
        result = false
    }

    approvalsByArea.forEach(function(approvals, area) {
        if (approvals.length < minApprovingReviewsPerArea) {
            console.log(`Not enough approvals for area ${area}: expected ${minApprovingReviewsPerArea} but got ${approvals.size}`)
            result = false
        }
    })

    return result
}

exports.getApprovals = getApprovals;
exports.canBeMerged = canBeMerged;
