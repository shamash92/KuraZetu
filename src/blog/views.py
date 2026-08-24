from functools import wraps

from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.utils.html import json_script
from django.utils.safestring import mark_safe
from django.views.decorators.cache import cache_page

from blog.posts import all_posts, get_post

CACHE_SECONDS = 60 * 15


def cached(view):
    """Serve from cache outside DEBUG, checked per request rather than at import."""
    cached_view = cache_page(CACHE_SECONDS)(view)

    @wraps(view)
    def dispatch(request, *args, **kwargs):
        if settings.DEBUG:
            return view(request, *args, **kwargs)
        return cached_view(request, *args, **kwargs)

    return dispatch


@cached
def post_list(request):
    return render(request, "blog/list.html", {"posts": all_posts()})


def _json_ld_script(value):
    script = str(json_script(value))
    return mark_safe(
        script.replace(
            'type="application/json"',
            'type="application/ld+json"',
            1,
        )
    )


def _detail_context(request, post):
    canonical_url = request.build_absolute_uri(reverse("blog:detail", args=[post.slug]))
    image = post.social_image or post.image or settings.DEFAULT_SOCIAL_IMAGE
    if not image.startswith(("http://", "https://", "//")):
        image = static(image)
    social_image_url = request.build_absolute_uri(image)
    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date.isoformat(),
        "author": {
            "@type": "Person",
            "name": post.author,
            "url": f"https://github.com/{post.author}",
        },
        "image": social_image_url,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url,
        },
        "publisher": {
            "@type": "Organization",
            "name": "Kura Zetu",
            "url": request.build_absolute_uri(reverse("home")),
        },
    }
    if post.updated:
        article["dateModified"] = post.updated.isoformat()
    return {
        "post": post,
        "canonical_url": canonical_url,
        "social_image_url": social_image_url,
        "article_json_ld_script": _json_ld_script(article),
    }


@cached
def post_detail(request, slug):
    post = get_post(slug)
    if post is None:
        raise Http404(f"No blog post at {slug}")
    return render(request, "blog/detail.html", _detail_context(request, post))
