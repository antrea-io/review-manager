let buildRegexList = function(areaOwners) {
    let list = [];
    areaOwners.forEach(function(owners, label) {
        list.push([new RegExp(label), owners]);
    });
    return list;
};

let labelToOwners = function(label, excludeUser, mapping, regexList) {
    let owners;
    const ownersForExactLabel = mapping.get(label);
    if (ownersForExactLabel !== undefined) { // exact label match
        owners = ownersForExactLabel;
    } else { // regex label match
        for (let i = 0; i < regexList.length; i++) {
            const re = regexList[i][0];
            const ownersForRegexLabel = regexList[i][1];
            if (re.test(label)) {
                owners = ownersForRegexLabel;
            }
        }
    }
    if (owners !== undefined && excludeUser !== undefined) {
        owners = owners.filter(owner => owner !== excludeUser);
    }
    return owners;
};

exports.labelToOwners = labelToOwners;
exports.buildRegexList = buildRegexList;
