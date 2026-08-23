import datetime

from django.contrib.syndication.views import Feed
from django.urls import reverse, reverse_lazy

from blog.posts import all_posts


class BlogFeed(Feed):
    title = "Kura Zetu Blog"
    link = reverse_lazy("blog:list")
    feed_url = reverse_lazy("blog:feed")
    description = "Updates from the KuraZetu technical team."

    def items(self):
        return all_posts()

    def item_title(self, post):
        return post.title

    def item_description(self, post):
        return post.description

    def item_link(self, post):
        return reverse("blog:detail", args=[post.slug])

    def item_pubdate(self, post):
        return datetime.datetime.combine(
            post.date,
            datetime.time.min,
            tzinfo=datetime.timezone.utc,
        )

    def item_author_name(self, post):
        return post.author
