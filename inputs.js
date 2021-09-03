const yaml = require('js-yaml')
const fs   = require('fs');

let parseOwners = function(path) {
    const areaOwners = yaml.load(fs.readFileSync(path, 'utf8'));
    return new Map(Object.entries(areaOwners.owners))
}

exports.parseOwners = parseOwners;
