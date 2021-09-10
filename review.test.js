const review = require('./review');
const owners = require('./owners');

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

    beforeAll(() => {
        // silence all console logs, can be commented-out if needed for debugging
        console.log = jest.fn();
        console.warn = jest.fn();
    });

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
