# Security policy

## Reporting a vulnerability

Please do **not** open a public issue. Report privately through GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability),
or contact the maintainers directly.

## Report server findings against the core repository

The MCP **server** lives in
[XfeaturesAthenaeum](https://github.com/XfeaturesGroup/XfeaturesAthenaeum). This
repository holds documentation, configuration and client examples. Anything of
the form "an MCP tool returned data I should not be able to see", "a tool let me
publish or delete something", or "MCP accepted a credential REST would reject"
is a **server** finding and belongs there — that is where the fix and its
regression test have to live.

Those are also the highest-value findings we can receive. The central claim is
that MCP has no privilege surface of its own: it runs the same
authenticate → authorize → audit pipeline as every other transport, and a tool
call has exactly the permissions of the credential that invoked it.

## In scope here

- **Documentation that is wrong in a dangerous direction** — a described
  permission, guarantee or limit that does not match what the server enforces.
  A doc that overstates a protection is a real defect.
- **Examples that mishandle a credential** — a token written to a file that gets
  committed, logged, placed in a URL, or sent to a host other than the one
  configured.
- **`examples/probe.mjs`** — anything that causes it to send a token somewhere
  unintended, or to report a connection as healthy when it is not.

## Known and deliberate

- **A read you are not cleared for returns `NOT_FOUND`, not `FORBIDDEN`.** A
  `FORBIDDEN` would confirm that a document you may not see exists.
- **Revocation is bounded, not instant.** A positive token introspection is
  cached server-side for at most 60 seconds. Negative results are never cached.
- **Retrieved content is untrusted by design.** Athenaeum returns it inert and
  labelled; a document containing instruction-shaped text is expected, not a
  vulnerability. An agent that obeys retrieved text has an agent-side problem.
