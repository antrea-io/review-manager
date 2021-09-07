const inputs = require('./inputs');
const reviewers = require('./reviewers');
const approval = require('./approval');

describe ('Pasrse Owners', () => {
    test('all keys', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners.yml');
        expect(maintainers).toEqual(new Set(['ted']));
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaApprovers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
    })

    test('missing approvers', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners-without-approvers.yml');
        expect(maintainers).toEqual(new Set(['ted']));
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers).toEqual(new Map())
    })

    test('missing maintainers', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners-without-maintainers.yml');
        expect(maintainers).toEqual(new Set());
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaApprovers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
    })
})

describe('Compute reviewers', () => {
    let labels
    let author
    let areaReviewers
    let areaApprovers

    function computeReviewers() {
        const config = {
            areaReviewers: new Map(areaReviewers),
            areaApprovers: new Map(areaApprovers),
        }
        return reviewers.computeReviewers(labels, author, config)
    }

    beforeAll(() => {
        labels = ['documentation']
        author = "alice"
        areaReviewers = []
        areaApprovers = []
    })

    test('author removal', async () => {
        areaReviewers = [['documentation', ['alice', 'bob']]]
        expect(computeReviewers()).toEqual(['bob'])
    })

    test('combine 1', async() => {
        author = "clara"
        areaReviewers = [['documentation', ['alice', 'bob']]]
        areaApprovers = [['documentation', ['alice']]]
        expect(computeReviewers()).toEqual(expect.arrayContaining(['alice', 'bob']))
    })

    test('combine 2', async() => {
        author = "clara"
        areaReviewers = [['documentation', ['alice']]]
        areaApprovers = [['documentation', ['alice', 'bob']]]
        expect(computeReviewers()).toEqual(expect.arrayContaining(['alice', 'bob']))
    })
});

describe('PR can be merged', () => {
    let labels
    let approvers
    let maintainers
    let minApprovingReviewsTotal
    let minApprovingReviewsPerArea
    let areaApprovers
    let failIfNoAreaLabel
    let succeedIfMaintainerApproves

    function canBeMerged(approvals) {
        const config = {
            minApprovingReviewsTotal: minApprovingReviewsTotal,
            minApprovingReviewsPerArea: minApprovingReviewsPerArea,
            maintainers: maintainers,
            areaApprovers: areaApprovers,
            failIfNoAreaLabel: failIfNoAreaLabel,
            succeedIfMaintainerApproves: succeedIfMaintainerApproves,
        }
        return approval.canBeMerged(labels, approvals, config)
    }

    beforeAll(() => {
        labels = ['documentation']
        approvers = [['documentation', ['alice', 'bob']], ['foo', ['bob', 'mike', 'joe']]]
        areaApprovers = new Map(approvers)
        maintainers = new Set()
        minApprovingReviewsTotal = 2
        minApprovingReviewsPerArea = 1
        failIfNoAreaLabel = true
        succeedIfMaintainerApproves = false
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

    test('accept no area label', async () => {
        labels = []
        failIfNoAreaLabel = false
        const approvals = new Set(['alice', 'joe'])
        expect(canBeMerged(approvals)).toBeTruthy()
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

    test('maintainer bypass', async () => {
        maintainers = ['alice']
        succeedIfMaintainerApproves = true
        const approvals = new Set(['alice'])
        expect(canBeMerged(approvals)).toBeTruthy()
    })
});
