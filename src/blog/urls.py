from django.urls import path

from blog import views
from blog.feeds import BlogFeed

app_name = "blog"

urlpatterns = [
    path("", views.post_list, name="list"),
    path("feed.xml", BlogFeed(), name="feed"),
    path("<slug:slug>/", views.post_detail, name="detail"),
]
