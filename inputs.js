const yaml = require('js-yaml')
const fs   = require('fs');

let parseOwners = function(path) {
    try {
        const areaOwners = yaml.load(fs.readFileSync(path, 'utf8'));
        return {
            maintainers: new Set(areaOwners.maintainers || []),
            areaReviewers: new Map(Object.entries(areaOwners.reviewers || {})),
            areaApprovers: new Map(Object.entries(areaOwners.approvers || {})),
        }
    } catch (error) {
        console.logs(`cannot parse owners file: ${error}`)
        throw error
    }
}

exports.parseOwners = parseOwners;
