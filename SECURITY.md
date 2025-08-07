# Security Policy

## Supported Versions

We provide security updates for the following versions of the Obsidian AI Plugin:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### How to Report

1. **Email**: Send a detailed report to [security@example.com](mailto:security@example.com)
2. **GitHub Security**: Use GitHub's private vulnerability reporting feature
3. **Do NOT create a public issue** for security vulnerabilities

### What to Include

Please include the following information in your report:

- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact and severity
- **Screenshots/Logs**: Any relevant evidence
- **Environment**: OS, Obsidian version, plugin version
- **Suggested Fix**: If you have ideas for fixing the issue

### Response Timeline

- **Initial Response**: Within 48 hours
- **Investigation**: Within 1 week
- **Fix Development**: Depends on severity (1-4 weeks)
- **Disclosure**: After fix is released and users have time to update

### Security Best Practices

When using this plugin:

1. **API Keys**: Never share your API keys publicly
2. **Updates**: Keep the plugin updated to the latest version
3. **Settings**: Review and understand all plugin settings
4. **Data**: Be aware of what data is being processed and stored
5. **Network**: Use secure networks when syncing external data

### Scope

Security issues we consider in scope:

- **Data Privacy**: Unauthorized access to user data
- **API Security**: Issues with API key handling
- **Code Injection**: XSS, code injection vulnerabilities
- **Authentication**: Bypass of authentication mechanisms
- **Data Integrity**: Corruption or manipulation of user data

### Out of Scope

- **General bugs** that don't have security implications
- **Feature requests** unrelated to security
- **Third-party service issues** (OpenAI, Anthropic, etc.)
- **Social engineering** attacks
- **Physical attacks** on user devices

### Bug Bounty

Currently, we do not offer a monetary bug bounty program, but we will:

- Acknowledge your contribution in our security advisories
- Credit you in our release notes (if desired)
- Provide a direct line of communication for future security concerns

### Security Updates

Security updates will be:

1. **Released promptly** after fixes are developed
2. **Clearly marked** in release notes
3. **Communicated** through multiple channels
4. **Backwards compatible** when possible

Thank you for helping keep our users safe!
