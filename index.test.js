const inputs = require('./inputs');

test('parse owners', async () => {
    const areaOwners = inputs.parseOwners('testdata/owners.yml');
    expect(areaOwners['area/area-1']).toEqual(expect.arrayContaining(['alice', 'bob']));
});
