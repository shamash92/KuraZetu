# Contributing Guidelines

Thank you for your interest in contributing to this project! Please read the following guidelines carefully to ensure a smooth and effective collaboration.

## Anonymity and Safety

```{caution}
Anonymity is crucial due to the real risks of government surveillance, abductions, and threats to life, as historically demonstrated. Your safety is our priority.
We strongly recommend setting up an anonymous GitHub account to protect your identity.

> You can follow [this guide](./how-to-guides/anonymous_github.md) to create a secure account.
```

## Contribution Workflow

1. **Create Issues First**:
    - Before submitting a Pull Request (PR), create an issue describing the problem or feature.
    - Link your PR to the corresponding issue for better tracking and context.

2. **Work on Open Issues**:
    - New contributors are encouraged to start with existing open issues before creating new ones.

3. **Short and Precise PRs**:
    - Submit small, focused PRs that are easy to review and merge.
    - Avoid large PRs as they hinder the review process.

4. **Branch Management**:
    - Contributors will review, merge, and delete branches promptly to maintain a clean repository.

5. **Suggestions Over Commits**:
    - Where applicable, provide suggestions for PRs instead of checking out and adding commits.

6. **CI Checks**:
    - Ensure all Continuous Integration (CI) checks pass before submitting your PR.

## Code, commits and documentation standards

- **Testing**:
  - All code must include appropriate tests. PRs without tests will not be accepted.

- **Documentation**:
  - Any code requiring updates, additions, or deletions in documentation must include the necessary documentation changes.

- **Local Checks**:
  - Before submitting a PR, run the following local checks to ensure documentation quality:
    - `make spelling`: Checks for spelling errors in the documentation using the [vale](https://vale.sh/) tool.
    - `make linkcheck`: Verifies that all links in the documentation are valid.
    - `make woke`: Identifies non-inclusive language in the documentation.

- **Note on Commits and Pre-commit Hooks**

    ```{important}

    This project uses pre-commit hooks (like `black` and `isort`) to enforce code formatting before each commit.

    🔹 **Please commit using your terminal**, not the VSCode Git sidebar, so you can clearly see hook results and any errors.

    🔹 If you're using **VSCode**, it’s highly recommended to configure it to **automatically format with `black` and `isort` on save**. This minimizes formatting issues and reduces failed commits.

    Here's a sample VSCode settings snippet you can add to `.vscode/settings.json`:

      ```json
      {
        "python.formatting.provider": "black",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.organizeImports": true
        }
      }
      ```

    This setup ensures your code is formatted consistently and passes the pre-commit checks without frustration.

    ```

- **Database Schema Changes**:
  - PRs involving database schema changes will only be accepted if linked to an approved issue.

- **Stack Changes**:
  - Changes to the tech stack (Django/React) require approval from the head maintainer.

- **Dependencies**:
  - Any additions to `requirements.txt` or `package.json` must have a linked and approved issue.

## Code of Conduct

- Malicious or troll PRs will be blocked immediately.
- Respect the community and maintain a collaborative environment.

Thank you for contributing and helping us build a better project together!
