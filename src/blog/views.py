from functools import wraps

from django.conf import settings
from django.http import Http404
from django.shortcuts import render
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


@cached
def post_detail(request, slug):
    post = get_post(slug)
    if post is None:
        raise Http404(f"No blog post at {slug}")
    return render(request, "blog/detail.html", {"post": post})
