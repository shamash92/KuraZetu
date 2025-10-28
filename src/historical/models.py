from stations.models import County, Constituency, Ward
from django.db import models
from results.models import Aspirant


class Aspirant2017(Aspirant):
    year = models.PositiveIntegerField(default=2017)
    is_running_mate = models.BooleanField(default=False)

    class Meta:
        verbose_name = "2017 Aspirant"
        verbose_name_plural = "2017 Aspirants"

    def __str__(self):
        return f"{self.first_name } {self.last_name} {self.surname}"


class PresidentialResults(models.Model):
    class Meta:
        verbose_name = "Presidential Results"
        verbose_name_plural = "Presidential Results"
        unique_together = ("county", "aspirant")

    county = models.ForeignKey(
        County, on_delete=models.CASCADE, related_name="presidential_results"
    )
    registered_voters = models.PositiveIntegerField()
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="pres_results_2017"
    )
    aspirant_votes = models.PositiveIntegerField()
    total_valid_votes = models.PositiveIntegerField()
    rejected_ballots = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} Presidential Results"


class GovernorResults(models.Model):
    class Meta:
        verbose_name = "Governor Results"
        verbose_name_plural = "Governor Results"
        unique_together = ("county", "aspirant")

    county = models.ForeignKey(
        County, on_delete=models.CASCADE, related_name="governor_results"
    )
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="gov_results_2017"
    )
    running_mate = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="running_mate_gov"
    )
    aspirant_votes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} Governor Results"


class SenatorResults(models.Model):
    class Meta:
        verbose_name = "Senator Results"
        verbose_name_plural = "Senator Results"
        unique_together = ("county", "aspirant")

    county = models.ForeignKey(
        County, on_delete=models.CASCADE, related_name="senator_results"
    )
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="sen_results_2017"
    )
    aspirant_votes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} Senator Results"


class WomenRepResults(models.Model):
    class Meta:
        verbose_name = "Women Rep Results"
        verbose_name_plural = "Women Rep Results"
        unique_together = ("county", "aspirant")

    county = models.ForeignKey(
        County, on_delete=models.CASCADE, related_name="women_rep_results"
    )
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="women_rep_results_2017"
    )
    aspirant_votes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} Women Rep Results"


class MPResults(models.Model):
    class Meta:
        verbose_name = "MP Results"
        verbose_name_plural = "MP Results"
        unique_together = ("constituency", "aspirant")

    constituency = models.ForeignKey(
        Constituency, on_delete=models.CASCADE, related_name="mp_results"
    )
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="mp_results_2017"
    )
    aspirant_votes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} MP Results"


class MCAResults(models.Model):
    class Meta:
        verbose_name = "MCA Results"
        verbose_name_plural = "MCA Results"
        unique_together = ("ward", "aspirant")

    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name="mca_results")
    aspirant = models.ForeignKey(
        Aspirant2017, on_delete=models.CASCADE, related_name="mca_results_2017"
    )
    aspirant_votes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.aspirant.surname} MCA Results"
