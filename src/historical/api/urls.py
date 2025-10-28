from django.urls import path
from historical.api.views import PresidentialResultsByCountyAndYearView,GovernorResultsByCountyAndYearView

urlpatterns = [
    path('presidential/<int:year>/<int:county_number>/', PresidentialResultsByCountyAndYearView.as_view(), name='presidential-results-by-county'),
    path('governor/<int:year>/<int:county_number>/', GovernorResultsByCountyAndYearView.as_view(), name='governor-results-by-county'),

]