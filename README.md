# `@antrea-io/review-manager` Github Action

The purpose of this Github action is 2-fold:
- provide a simple way to automatically request reviews for PRs from specific
  Github users based on the PRs' labels
- report a successfull status if the PR has been reviewed (and approved) by an
  appropriate set of Github users

Note that we distinguish between "reviewers", who are invited to review a PR but
whose review will not directly count when deciding whether the PR can be merged,
and "approvers", whose review will determine if a successful status is reported
and therefore if the PR can be merged.

## Usage

The Action is used as follows:

```yaml
name: Review management
on:
  pull_request_target:
    branches:
    - main
    types: ["opened", "synchronize", "reopened", "labeled", "unlabeled", "ready_for_review", "review_request_removed"]
  pull_request_review:
    branches:
    - main

permissions:
  pull-requests: write

jobs:
  test:
    runs-on: [ubuntu-latest]
    steps:
    - name: Check-out code
      uses: actions/checkout@v2
    - uses: antrea-io/review-manager@v0.2.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        area_ownership_file: 'AREA-OWNERS'
```

You can see that this example assumes the existence of a YAML `AREA-OWNERS`
file, which is used to map PR labels to reviewers and approvers. You can choose
any name you want and place the file anywhere in the repository. The provided
path is relative to the root of your repository. The format of the file is as
follows:

```yaml
maintainers:
  - alice

reviewers:
  area/area-1:
  - alice
  area/area-2:
  - alice
  - bob

approvers:
  area/area-1:
  - alice
  - bob
  - mike
  area/area-2:
  - alice
  - bob
  - clara
```

In this example, `area/area-1` and `area/area-2` are labels, which are mapped to
different reviewers and approvers (using Github IDs).

Note that approvers are always treated as reviewers, so it is typically not
necessary to duplicate approvers as reviewers. In many cases, it may be
desirable to conflate the meaning of "reviewers" and "approvers", and have all
reviewers be approvers. In this case, just omit the `reviewers` key altogether.

### Configuration Options

TODO

### `pull_request_target`

The Actions relies on the `pull_request_target` Workflow event type, which is
granted a read/write repository token. It is a good idea to be aware of the
[security vulnerabilities](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request_target)
that affect `pull_request_target` *in the general case*. However, because this
Action does not "check out, build, or run untrusted code" as part of its
execution, it does not suffer from these vulnerabilities.
