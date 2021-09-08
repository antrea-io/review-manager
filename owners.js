let buildRegexList = function(areaOwners) {
    let list = [];
    areaOwners.forEach(function(owners, label) {
        list.push([new RegExp(label), owners]);
    });
    return list;
};

let labelToOwners = function(label, mapping, regexList) {
    const ownersForExactLabel = mapping.get(label);
    if (ownersForExactLabel !== undefined) {
        return ownersForExactLabel;
    }
    for (let i = 0; i < regexList.length; i++) {
        const re = regexList[i][0];
        const ownersForRegexLabel = regexList[i][1];
        if (re.test(label)) {
            return ownersForRegexLabel;
        }
    }
    return [];
};

exports.labelToOwners = labelToOwners;
exports.buildRegexList = buildRegexList;
