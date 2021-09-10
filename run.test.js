const core = require('@actions/core');
const github = require('@actions/github');
const run = require('./run');

describe('run', () => {
    let inputs;
    let labels;
    let author;
    let pullRequest;

    const owner = "some-owner";
    const repo = "some-repo";
    const pullRequestNumber = 1;
    const successLabel = 'can be merged';

    const mockRequestReviewers = jest.fn();
    const mockListReviews = jest.fn();
    const mockAddLabels = jest.fn();
    const mockRemoveLabel = jest.fn();
    const mockOctokit = {
        rest: {
            pulls: {
                requestReviewers: mockRequestReviewers,
                listReviews: mockListReviews,
            },
            issues: {
                addLabels: mockAddLabels,
                removeLabel: mockRemoveLabel,
            },
        },
        paginate: {
            iterator: function(fn, arg) { return fn(arg); },
        },
    };

    beforeAll(() => {
        // silence all console logs, can be commented-out if needed for debugging
        console.debug = jest.fn();
        console.log = jest.fn();
        console.warn = jest.fn();

        // Mock getInput
        jest.spyOn(core, 'getInput').mockImplementation(name => {
            return inputs[name];
        });

        jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
            return {
                owner: owner,
                repo: repo,
            };
        });

        core.setFailed = jest.fn();

        jest.spyOn(github, 'getOctokit').mockImplementation(() => {
            return mockOctokit;
        });
    });

    function setContextPayload(labels, author) {
        pullRequest = {
            draft: false,
            number: pullRequestNumber,
            user: {
                login: author,
            },
            labels: labels.map(label => {
                return {name: label};
            }),
        };
        github.context.payload = {
            pull_request: pullRequest,
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
        inputs = {
            min_approving_reviews_total: 2,
            min_approving_reviews_per_area: 1,
            area_ownership_file: 'testdata/owners.yml',
            fail_if_missing_approving_reviews: true,
            label_on_success: successLabel,
            fail_if_no_area_label: true,
            succeed_if_maintainer_approves: false,
            request_reviews_from_maintainers_if_neede: true,
            ignore_if_not_labelled_with: '',
            fail_if_not_enough_available_approvers: true,
            maintainers_are_universal_approvers: true,
        };
        labels = [];
        author = "alice";
    });

    test('success', async () => {
        labels = ['area/area-1'];
        setContextPayload(labels, author);
        const reviews = [
            {user: {login: 'bob'}, state: 'APPROVED' },
            {user: {login: 'john'}, state: 'APPROVED' },
        ];
        mockListReviews.mockReturnValueOnce([{data: reviews}]);
        await run();

        expect(mockRequestReviewers.mock.calls.length).toBe(1);
        expect(mockRequestReviewers.mock.calls[0]).toEqual([{
            owner: owner,
            repo: repo,
            pull_number: pullRequestNumber,
            reviewers: ['bob'],
        }]);
        expect(mockListReviews.mock.calls.length).toBe(1);
        expect(mockListReviews.mock.calls[0]).toEqual([{
            owner: owner,
            repo: repo,
            pull_number: pullRequestNumber,
            per_page: 100,
        }]);
        expect(mockAddLabels.mock.calls.length).toBe(1);
        expect(mockAddLabels.mock.calls[0]).toEqual([{
            owner: owner,
            repo: repo,
            issue_number: pullRequestNumber,
            labels: [successLabel],
        }]);
        expect(mockRemoveLabel.mock.calls.length).toBe(0);
    });

    test('remove success label', async () => {
        labels = ['area/area-1', successLabel];
        setContextPayload(labels, author);
        const reviews = [
            {user: {login: 'bob'}, state: 'APPROVED' },
        ];
        mockListReviews.mockReturnValueOnce([{data: reviews}]);
        await run();
        expect(mockAddLabels.mock.calls.length).toBe(0);
        expect(mockRemoveLabel.mock.calls.length).toBe(1);
        expect(mockRemoveLabel.mock.calls[0]).toEqual([{
            owner: owner,
            repo: repo,
            issue_number: pullRequestNumber,
            label: successLabel,
        }]);
    });
});
