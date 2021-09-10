const inputs = require('./inputs');

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
