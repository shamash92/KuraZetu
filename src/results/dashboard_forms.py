from django import forms

from phonenumber_field.formfields import PhoneNumberField

from results.dashboard_models import ResultsDashboard


class DashboardForm(forms.ModelForm):
    owner_phone = PhoneNumberField(label="Owner phone number")

    class Meta:
        model = ResultsDashboard
        fields = ["aspirant", "party", "media_house", "active"]
        labels = {"active": "Dashboard access active"}
        error_messages = {
            "aspirant": {"unique": "A dashboard already exists for this aspirant."},
            "party": {"unique": "A dashboard already exists for this party."},
            "media_house": {
                "unique": "A dashboard already exists for this media house."
            },
        }

    def clean(self):
        data = super().clean()
        aspirant = data.get("aspirant")
        party = data.get("party")
        if aspirant:
            area = next(
                (
                    getattr(aspirant, key)
                    for key in ("county", "constituency", "ward")
                    if getattr(aspirant, key + "_id")
                ),
                None,
            )
            self.instance.name = f"{aspirant.full_name} · {aspirant.get_level_display()} · {area.name if area else 'National'} dashboard"[
                :160
            ]
        elif party:
            self.instance.name = f"{party.name} dashboard"[:160]
        elif data.get("media_house"):
            self.instance.name = f"{data['media_house'].name} dashboard"[:160]
        return data

    def __init__(self, *args, kind, **kwargs):
        super().__init__(*args, **kwargs)
        self.instance.kind = kind
        if kind != "media":
            self.fields.pop("media_house")
        if kind != "aspirant":
            self.fields.pop("aspirant")
        if kind != "party":
            self.fields.pop("party")
        if kind == "aspirant":
            self.fields["aspirant"].queryset = self.fields[
                "aspirant"
            ].queryset.select_related("party")
        field = "media_house" if kind == "media" else kind
        self.fields[field].required = True
        if self.instance.pk:
            owner = self.instance.members.filter(is_owner=True).first()
            if owner:
                self.fields["owner_phone"].initial = owner.phone_number


class ViewerForm(forms.Form):
    phone_number = PhoneNumberField(label="Viewer phone number")
