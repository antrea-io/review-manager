const inputs = require('./inputs');
const review = require('./review');
const approval = require('./approval');
const owners = require('./owners');

describe ('Parse Owners', () => {
    test('all keys', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners.yml');
        expect(maintainers).toEqual(['ted']);
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaApprovers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
    });

    test('missing approvers', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners-without-approvers.yml');
        expect(maintainers).toEqual(['ted']);
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers).toEqual(new Map());
    });

    test('missing maintainers', async () => {
        const {maintainers, areaReviewers, areaApprovers} = inputs.parseOwners('testdata/owners-without-maintainers.yml');
        expect(maintainers).toEqual([]);
        expect(areaReviewers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaReviewers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
        expect(areaApprovers.get('area/area-1')).toEqual(expect.arrayContaining(['alice', 'bob']));
        expect(areaApprovers.get('area/area-2')).toEqual(expect.arrayContaining(['bob', 'john']));
    });
});

describe('Compute reviewers', () => {
    let labels;
    let author;
    let maintainers;
    let reviewers;
    let approvers;
    let requestReviewsFromMaintainersIfNeeded;

    function computeReviewers() {
        const areaReviewers = new Map(reviewers);
        const areaApprovers = new Map(approvers);
        const config = {
            minApprovingReviewsPerArea: 1,
            maintainers: maintainers,
            areaReviewers: areaReviewers,
            areaApprovers: areaApprovers,
            areaReviewersRegexList: owners.buildRegexList(areaReviewers),
            areaApproversRegexList: owners.buildRegexList(areaApprovers),
            requestReviewsFromMaintainersIfNeeded: requestReviewsFromMaintainersIfNeeded,
        };
        return review.computeReviewers(labels, author, config);
    }

    beforeEach(() => {
        labels = ['documentation'];
        author = "alice";
        maintainers = ['alice'];
        reviewers = [];
        approvers = [];
        requestReviewsFromMaintainersIfNeeded = false;
    });

    test('author removal', async () => {
        reviewers = [['documentation', ['alice', 'bob']]];
        expect(computeReviewers()).toEqual(['bob']);
    });

    test('not a known label', async() => {
        reviewers = [['not-documentation', ['alice', 'bob']]];
        expect(computeReviewers()).toEqual([]);
    });

    test('combine 1', async() => {
        author = "clara";
        reviewers = [['documentation', ['alice', 'bob']]];
        approvers = [['documentation', ['alice']]];
        expect(computeReviewers()).toEqual(expect.arrayContaining(['alice', 'bob']));
    });

    test('combine 2', async() => {
        author = "clara";
        reviewers = [['documentation', ['alice']]];
        approvers = [['documentation', ['alice', 'bob']]];
        expect(computeReviewers()).toEqual(expect.arrayContaining(['alice', 'bob']));
    });

    test('regex', async() => {
        reviewers = [['doc*', ['alice', 'bob']]];
        expect(computeReviewers()).toEqual(['bob']);
    });

    test('regex precedence', async() => {
        reviewers = [['documentation', ['mike']], ['doc*', ['alice', 'bob']]];
        expect(computeReviewers()).toEqual(['mike']);
    });

    test('request reviews from maintainers if needed - default', async() => {
        reviewers = [['documentation', ['bob']]];
        expect(computeReviewers()).toEqual(['bob']);
    });

    test('request reviews from maintainers if needed - true', async() => {
        requestReviewsFromMaintainersIfNeeded = true;
        maintainers = ['mike'];
        reviewers = [['documentation', ['bob']]];
        expect(computeReviewers()).toEqual(expect.arrayContaining(['bob', 'mike']));
    });
});

describe('PR can be merged', () => {
    let labels;
    let author;
    let maintainers;
    let reviewers;
    let approvers;
    let minApprovingReviewsTotal;
    let minApprovingReviewsPerArea;
    let failIfNoAreaLabel;
    let succeedIfMaintainerApproves;
    let failIfNotEnoughAvailableApproversPerArea;
    let requestReviewsFromMaintainersIfNeeded;
    let maintainersAreUniversalApprovers;

    function canBeMerged(approvals) {
        const areaReviewers = new Map(reviewers);
        const areaApprovers = new Map(approvers);
        const config = {
            minApprovingReviewsTotal: minApprovingReviewsTotal,
            minApprovingReviewsPerArea: minApprovingReviewsPerArea,
            maintainers: maintainers,
            areaReviewers: areaReviewers,
            areaApprovers: areaApprovers,
            areaReviewersRegexList: owners.buildRegexList(areaReviewers),
            areaApproversRegexList: owners.buildRegexList(areaApprovers),
            failIfNoAreaLabel: failIfNoAreaLabel,
            succeedIfMaintainerApproves: succeedIfMaintainerApproves,
            failIfNotEnoughAvailableApproversPerArea: failIfNotEnoughAvailableApproversPerArea,
            requestReviewsFromMaintainersIfNeeded: requestReviewsFromMaintainersIfNeeded,
            maintainersAreUniversalApprovers: maintainersAreUniversalApprovers,
        };
        return approval.canBeMerged(labels, author, approvals, config);
    }

    beforeAll(() => {
        // silence all console logs, can be commented-out if needed for debugging
        console.log = jest.fn();
        console.warn = jest.fn();
    });

    beforeEach(() => {
        labels = ['documentation'];
        author = "alice";
        reviewers = [];
        approvers = [['documentation', ['alice', 'bob']], ['foo', ['bob', 'mike', 'joe']]];
        maintainers = [];
        minApprovingReviewsTotal = 2;
        minApprovingReviewsPerArea = 1;
        failIfNoAreaLabel = true;
        succeedIfMaintainerApproves = false;
        requestReviewsFromMaintainersIfNeeded = false;
        failIfNotEnoughAvailableApproversPerArea = false;
        maintainersAreUniversalApprovers = false;
    });

    test('no approval', async () => {
        const approvals = new Set();
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('not enough approvals', async () => {
        const approvals = new Set(['alice']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('missing area approval', async () => {
        labels = ['documentation', 'foo'];
        const approvals = new Set(['mike', 'joe']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('no area label', async () => {
        labels = [];
        const approvals = new Set(['alice', 'bob']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('accept no area label', async () => {
        labels = [];
        failIfNoAreaLabel = false;
        const approvals = new Set(['alice', 'joe']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('approved documentation', async () => {
        labels = ['documentation'];
        const approvals = new Set(['bob', 'joe']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('approved foo', async () => {
        labels = ['foo'];
        const approvals = new Set(['joe', 'mike']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('approved with 2 labels', async () => {
        labels = ['foo', 'documentation'];
        const approvals = new Set(['bob', 'fred']); // fred is not an approver for any specific area
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('maintainer bypass', async () => {
        maintainers = ['alice'];
        succeedIfMaintainerApproves = true;
        const approvals = new Set(['alice']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('not enough approvers for area - default', async () => {
        minApprovingReviewsPerArea = 2;
        approvers = [['documentation', ['alice']]];
        const approvals = new Set(['alice', 'bob']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('no approvers for area - default', async () => {
        approvers = [['documentation', []]];
        const approvals = new Set(['alice', 'bob']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('not enough approvers for area - fail', async () => {
        failIfNotEnoughAvailableApproversPerArea = true;
        approvers = [['documentation', []]];
        const approvals = new Set(['alice', 'bob']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('regex', async() => {
        approvers = [['doc*', ['alice', 'bob']]];
        const approvals = new Set(['alice', 'bob']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('regex precedence', async() => {
        approvers = [['documentation', ['mike']], ['doc*', ['alice', 'bob']]];
        const approvals = new Set(['alice', 'bob']);
        // exact match takes precedence, review from mike is needed
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('request reviews from maintainers if needed - default', async() => {
        maintainers = ['alice', 'mike'];
        failIfNotEnoughAvailableApproversPerArea = true;
        reviewers = [['documentation', ['bob']]];
        approvers = [];
        const approvals = new Set(['alice', 'mike']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('request reviews from maintainers if needed - true', async() => {
        maintainers = ['alice', 'mike'];
        failIfNotEnoughAvailableApproversPerArea = true;
        requestReviewsFromMaintainersIfNeeded = true;
        reviewers = [['documentation', ['bob']]];
        approvers = [];
        const approvals = new Set(['alice', 'mike']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });

    test('maintainers are universal approvers - default', async() => {
        maintainers = ['alice', 'mike'];
        failIfNotEnoughAvailableApproversPerArea = true;
        reviewers = [['documentation', ['bob']]];
        approvers = [];
        const approvals = new Set(['bob', 'alice', 'mike']);
        expect(canBeMerged(approvals)).toBeFalsy();
    });

    test('maintainers are universal approvers - true', async() => {
        maintainers = ['alice', 'mike'];
        failIfNotEnoughAvailableApproversPerArea = true;
        maintainersAreUniversalApprovers = true;
        reviewers = [['documentation', ['bob']]];
        approvers = [];
        const approvals = new Set(['alice', 'mike']);
        expect(canBeMerged(approvals)).toBeTruthy();
    });
});
