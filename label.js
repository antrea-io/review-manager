const github = require('@actions/github');

async function addLabel(owner, repo, pullNumber, token, label) {
    const octokit = github.getOctokit(token);

    console.log(
        JSON.stringify({
        owner: owner,
        repo: repo,
        pull_number: pullNumber,
        label: label,
      })
    );

    try {
        await octokit.rest.issues.addLabels({
            owner: owner,
            repo: repo,
            issue_number: pullNumber,
            labels: [label],
        });
    } catch(err) {
        console.log(`cannot add label: ${err}`)
        throw err
    }
}

exports.addLabel = addLabel;
