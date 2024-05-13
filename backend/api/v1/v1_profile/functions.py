from rest_framework.generics import get_object_or_404
from api.v1.v1_profile.models import Administration, Levels


def get_administration_ids_by_path(administration_id):
    adm = get_object_or_404(Administration, pk=administration_id)
    max_level = Levels.objects.order_by("-level").first().id
    if max_level == adm.level:
        return [administration_id]
    if adm.path:
        path = "{}{}.".format(adm.path, administration_id)
    else:
        path = "{}.".format(administration_id)
    childs = Administration.objects.filter(path__contains=path).values_list(
        "id", flat=True
    )
    return childs
