let computeReviewers = function(labels, areaOwners) {
    const reviewers = new Set()
    labels.forEach(label => {
        const owners = areaOwners.get(label.name)
        if (owners === undefined) {
            return
        }
        owners.forEach(owner => reviewers.add(owner))
    })
    return reviewers
}

exports.computeReviewers = computeReviewers;
