---
title: "Lessons from a Security Incident"
author: shamash92
date: 2026-08-23
updated: 2026-08-24
description: "What we learned after a signup flaw allowed unauthorized privileged accounts, and how we are hardening KuraZetu."
image: blog/images/security-incident-hardening.png
social_image: blog/images/security-incident-hardening.png
draft: false
---
During an investigation on August 23, 2026, we discovered that someone had been creating unauthorized accounts on KuraZetu. We want to share what happened, what we learned, and how we're changing our approach to security.

This wasn't a sophisticated attack. It didn't require zero-day exploits or advanced persistent threats. It was simpler than that: a flaw in our signup endpoint allowed anyone to create admin accounts, and we didn't catch it for months. That's on us, and we're fixing it.

## What happened

Between late December 2025 and mid-August 2026, an individual or group used our public signup API to create **81 unauthorized accounts**. Seventy-nine had `staff` or `admin` privileges; two had only the `is_verified` flag set. They did this by including `staff=True` and `admin=True` flags in their signup requests, which our API incorrectly accepted and honored.

Here's what the attacker was able to do:

- **Create admin accounts:** 81 accounts total, many with obviously scripted names like "Nagini Exploit," "Test Superuser," and even XSS payloads like `<svg/onload=alert(1)>`
- **Write to the results database:** 47 fabricated entries in our presidential election extras table (things like "valid_votes_cast: 999999" at polling stations)
- **Access admin-level API endpoints:** Though they never accessed the Django admin dashboard itself

Here's what they **did not** do:

- **Compromise the VPS:** Our SSH audit found no evidence of unauthorized access. The attack path was through the application layer.
- **Enumerate accounts through the accounts API:** It exposes no user list or detail endpoint. We found no evidence in this investigation that other users' records were accessed.
- **Modify core election results:** The main presidential results table (102 entries) was untouched. Only the "extras" metadata table was affected.

## How we found out

We discovered this during a routine security review. We noticed accounts with admin privileges that we didn't recognize, and the pattern was unmistakable: sequential phone numbers, test-style names, and creation timestamps clustered in bursts (January 20, February 12, etc.).

The smoking gun was Django's admin activity table. It contained only **6 write entries**, all associated with the legitimate administrator. Creating users through Django admin would have produced corresponding entries, so their absence ruled out the admin interface as the account-creation path. The accounts came through the public API.

## The technical details

The root cause was a combination of two issues we'd already identified in our security backlog:

1. **[Issue #82](https://github.com/shamash92/KuraZetu/issues/82):** Our signup serializer exposed privileged fields (`staff`, `admin`, `is_verified`) as writable, and our view passed client input directly to the User model.

2. **[Issue #83](https://github.com/shamash92/KuraZetu/issues/83):** Our custom User model had stub permission methods that always returned `True`, meaning any "staff" account could access everything.

Here's the problematic code pattern:

```{.python title="accounts/api/views.py"}
# What we had (simplified):
class SignupView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data["data"])
        if serializer.is_valid():
            # DANGER: This accepted staff=True, admin=True from the client
            user = User(**serializer.validated_data)
            user.save()
```

And the permission stubs that made it worse:

```{.python title="accounts/models.py"}
def has_perm(self, perm, obj=None):
    return True  # Always yes - effectively no permission checks

def has_module_perms(self, app_label):
    return True  # Always yes
```

The attacker likely used ordinary tools such as Postman, curl, or a simple Python script to send crafted signup requests. We cannot know the exact client from the evidence available, but exploiting this flaw required no VPS access or password brute-forcing, only a public API that trusted client input too much.

## What we did

Once we understood the scope, we acted quickly:

| Action | Count | Status |
|--------|-------|--------|
| Rogue accounts identified | 81 | [x] All disabled |
| Auth tokens revoked | 81 | [x] Deleted |
| Tampered data rows removed | 47 | [x] Deleted |
| Legitimate admin accounts | 1 | [x] Verified safe |
| VPS compromise | 0 | [x] Ruled out via SSH audit |

We disabled all rogue accounts (set `active=False`, `staff=False`, `admin=False`), deleted their API tokens, and removed the fabricated election data they'd submitted. We also verified that our server itself was never compromised. All SSH logins came from known IP addresses, and there were no unauthorized users on the system.

## What we're changing

This incident exposed a gap in how we think about security. We were treating it as a checklist item rather than an ongoing practice. That's changing.

**Immediate fixes (already deployed):**

- Signup endpoint now uses a dedicated serializer with a strict allow-list, so authority fields never enter `validated_data`
- Permission methods now gate access on `is_admin` instead of returning `True`
- Added regression tests to prevent this specific flaw from recurring

**Process changes:**

- **Security review cadence:** Weekly reviews of user accounts, permissions, and API access logs
- **Login monitoring:** We've enabled detailed authentication logging that alerts us to suspicious patterns (multiple account creation bursts, unusual privilege escalation, etc.)
- **Defense in depth:** We're implementing additional infrastructure-level protections that we'll announce soon

**Looking ahead:**

We're exploring **agentic security monitoring**: automated systems that periodically review logs, flag anomalies, and surface potential issues before they become incidents. Think of it as an automated security researcher that never sleeps.

## A note on timing

You might notice that some of these unauthorized accounts existed for months before we caught them. That's fair criticism. We should have found this sooner. The issues that enabled this (#82 and #83) were actually identified and filed in our security backlog days before we discovered the breach, but we hadn't prioritized fixing them yet. That was a mistake.

We're learning that security can't be something we "get to eventually." It has to be part of the development process from day one, with active monitoring, not just passive logging.

## Thank you

To everyone who has contributed to KuraZetu, whether through code, testing, feedback, or just using the platform, thank you. Your trust matters, and we're working hard to earn it.

We believe transparency about security incidents, even uncomfortable ones, makes us all safer. If you have questions about this incident or our security practices, please reach out.

We'll be sharing more updates as we implement additional hardening measures. This isn't the end of the conversation. It's the beginning of a more security-conscious chapter for KuraZetu.

---

*If you discover a security issue in KuraZetu, please do not disclose it publicly. Contact a project maintainer privately so we can investigate it safely.*
