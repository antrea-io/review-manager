const fs   = require('fs');

const inputs = require('./inputs');
const reviewers = require('./reviewers');

test('parse owners', async () => {
    const areaOwners = inputs.parseOwners('testdata/owners.yml');
    expect(areaOwners['area/area-1']).toEqual(expect.arrayContaining(['alice', 'bob']));
});

test('compute reviewers', async () => {
    const payload = JSON.parse(fs.readFileSync('testdata/pull_request_payload.json', 'utf8'));
    const owners = [['documentation', ['alice']]]
    const areaOwners = new Map(owners)
    const reviewersSet = reviewers.computeReviewers(payload.pull_request.labels, areaOwners)
    expect(reviewersSet).toEqual(new Set(['alice']))
});
