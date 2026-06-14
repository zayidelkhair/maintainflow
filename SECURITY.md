# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **seeknoobwisdom@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to respond within 72 hours and will coordinate disclosure responsibly.

## Security scanning

This project dogfoods its own tooling:

```bash
maintainflow security --path .
```

Run before every release.