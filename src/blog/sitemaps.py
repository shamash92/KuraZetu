from dataclasses import dataclass

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from blog.posts import all_posts


@dataclass(frozen=True)
class StaticLocation:
    path: str
    changefreq: str
    priority: float


STATIC_LOCATIONS = (
    StaticLocation("/", "daily", 1.0),
    StaticLocation("/accounts/login/", "monthly", 0.8),
    StaticLocation("/accounts/ui/signup/", "monthly", 0.8),
    StaticLocation("/ui/game/", "weekly", 0.9),
    StaticLocation("/ui/download-apk/", "weekly", 0.9),
    StaticLocation("/api/schema/swagger/", "monthly", 0.7),
    StaticLocation("/api/schema/redoc/", "monthly", 0.7),
    StaticLocation("/api/schema/rapidoc/", "monthly", 0.7),
    StaticLocation("/blog/", "weekly", 0.9),
)


class StaticViewSitemap(Sitemap):
    protocol = "https"

    def items(self):
        return STATIC_LOCATIONS

    def location(self, item):
        return item.path

    def changefreq(self, item):
        return item.changefreq

    def priority(self, item):
        return item.priority


class BlogSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.8
    protocol = "https"

    def items(self):
        return all_posts()

    def location(self, post):
        return reverse("blog:detail", args=[post.slug])

    def lastmod(self, post):
        return post.updated or post.date
