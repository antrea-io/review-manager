const inputs = require('./inputs');
const reviewers = require('./reviewers');
const approval = require('./approval');

test('parse owners', async () => {
    const areaOwners = inputs.parseOwners('testdata/owners.yml');
    expect(areaOwners.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
});

test('compute reviewers', async () => {
    const labels = ['documentation']
    const owners = [['documentation', ['alice', 'bob']], ['foo', ['bob', 'mike']]]
    const areaOwners = new Map(owners)
    const reviewersSet = reviewers.computeReviewers(labels, 'alice', areaOwners)
    expect(reviewersSet).toEqual(['bob'])
});

describe('PR can be merged', () => {
    let labels
    let owners
    let areaOwners
    let minApprovingReviewsTotal
    let minApprovingReviewsPerArea

    function canBeMerged(approvals) {
        return approval.canBeMerged(labels, approvals, areaOwners, minApprovingReviewsTotal, minApprovingReviewsPerArea)
    }

    beforeAll(() => {
        labels = ['documentation']
        owners = [['documentation', ['alice', 'bob']], ['foo', ['bob', 'mike', 'joe']]]
        areaOwners = new Map(owners)
        minApprovingReviewsTotal = 2
        minApprovingReviewsPerArea = 1
    })

    test('no approval', async () => {
        const approvals = new Set()
        expect(canBeMerged(approvals)).toBeFalsy()
    })

    test('not enough approvals', async () => {
        const approvals = new Set(['alice'])
        expect(canBeMerged(approvals)).toBeFalsy()
    })

    test('missing area approval', async () => {
        labels = ['documentation', 'foo']
        const approvals = new Set(['mike', 'joe'])
        expect(canBeMerged(approvals)).toBeFalsy()
    })

    test('no area label', async () => {
        labels = []
        const approvals = new Set(['alice', 'bob'])
        expect(canBeMerged(approvals)).toBeFalsy()
    })

    test('approved documentation', async () => {
        labels = ['documentation']
        const approvals = new Set(['alice', 'joe'])
        expect(canBeMerged(approvals)).toBeTruthy()
    })

    test('approved foo', async () => {
        labels = ['foo']
        const approvals = new Set(['joe', 'mike'])
        expect(canBeMerged(approvals)).toBeTruthy()
    })

    test('approved with 2 labels', async () => {
        labels = ['foo', 'documentation']
        const approvals = new Set(['joe', 'alice'])
        expect(canBeMerged(approvals)).toBeTruthy()
    })
});
