---
name: Data issue
about: An API entry is wrong, missing, outdated, or mis-scored
title: "[data] "
labels: ["data", "needs-triage"]
assignees: []
---

## Affected entry

- API name:
- API URL:
- Category:
- Current quality grade (if you can find it):

## What's wrong

- [ ] Missing entirely
- [ ] URL is dead / redirects
- [ ] Description is wrong or empty
- [ ] Auth / HTTPS / CORS metadata is incorrect
- [ ] Quality grade seems wrong
- [ ] Wrong category
- [ ] Duplicate of another entry
- [ ] Other: ___

## Source of truth

Link to the upstream data source so the daily-update pipeline can pick
this up automatically:

- [ ] [public-apis/public-apis](https://github.com/public-apis/public-apis)
- [ ] [APIs.guru](https://apis.guru/)
- [ ] [keploy/public-apis-collection](https://github.com/keploy/public-apis-collection)
- [ ] Other: ___

If the upstream source already has the correct data, the next daily
run will fix it — please close this issue once you see the fix land.
