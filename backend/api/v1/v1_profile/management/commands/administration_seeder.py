import numpy as np
import pandas as pd
from django.core.management import BaseCommand
from api.v1.v1_profile.models import Levels, Administration

geo_config = [{
    "id": 1,
    "level": 0,
    "name": "NAME_0",
    "alias": "National"
}, {
    "id": 2,
    "level": 1,
    "name": "NAME_1",
    "alias": "County"
}, {
    "id": 3,
    "level": 2,
    "name": "NAME_2",
    "alias": "Sub-County"
}, {
    "id": 4,
    "level": 3,
    "name": "NAME_3",
    "alias": "Ward"
}, {
    "id": 5,
    "level": 4,
    "name": "NAME_4",
    "alias": "Village"
}]

source_file = './source/kenya-2024.csv'

MAX_LEVEL_IN_SOURCE_FILE = 4


def get_parent_id(df, x):
    if x["level"] == 0:
        return None
    parent_level = x["level"] - 1
    pid = df[(df["level"] == parent_level) & (df["name"] == x["p"])]
    pid = pid.to_dict("records")[0]
    return pid["id"]


def seed_levels():
    for geo in geo_config:
        level = Levels(id=geo["id"], name=geo["alias"], level=geo["level"])
        level.save()


def seed_administration_test():
    seed_levels()
    level = Levels.objects.filter(level=0).first()
    administration = Administration(id=1,
                                    name="Indonesia",
                                    parent=None,
                                    level=level)
    administration.save()
    for index, name in enumerate(
            ["Jakarta", "East Jakarta", "Kramat Jati", "Cawang"]):
        id = index + 2
        level = Levels.objects.filter(level=index + 1).first()
        path = '{0}.'.format(administration.id)
        if index:
            path = '{0}{1}.'.format(administration.path, administration.id)
        administration = Administration(id=id,
                                        name=name,
                                        parent=administration,
                                        level=level,
                                        path=path)
        administration.save()

    administration = Administration.objects.get(id=1)
    for index, name in enumerate(
            ["Yogyakarta", "Sleman", "Seturan", "Cepit Baru"]):
        id = index + 10
        level = Levels.objects.filter(level=index + 1).first()
        path = '{0}.'.format(administration.id)
        if index:
            path = '{0}{1}.'.format(administration.path, administration.id)
        administration = Administration(id=id,
                                        name=name,
                                        parent=administration,
                                        level=level,
                                        path=path)
        administration.save()


def get_path(df, parent, current=[]):
    p = df[df['id'] == parent].reset_index()
    if p.shape[0]:
        current = current + [p['id'][0]]
        return get_path(df, list(p['parent'])[0], current)
    current.reverse()
    path = ".".join([str(c) for c in current])
    if len(path):
        return f"{path}."
    return None


def seed_administration_prod():
    Administration.objects.all().delete()
    Levels.objects.all().delete()
    seed_levels()
    levels = [
        c["alias"] for c in geo_config
        if c['level'] <= MAX_LEVEL_IN_SOURCE_FILE
    ]
    properties = pd.read_csv(source_file).to_dict('records')
    df = pd.DataFrame(properties)
    # remove duplicates
    df = df.drop_duplicates()
    rec = df.to_dict("records")
    res = []
    for i, r in enumerate(rec):
        for iv, v in enumerate(levels):
            lv = list(filter(
                lambda x: x["alias"] == v, geo_config
            ))[0]["level"]
            parent_id = None
            if lv > 0:
                plv = levels[iv - 1]
                parent_id = r[f"{plv}_code"]
            id = None
            if lv < len(levels) - 1:
                id = r[f"{v}_code"]
            data = {
                "ids": id,
                "name": r[v],
                "parent": parent_id,
                "level": lv,
            }
            res.append(data)
    res = pd.DataFrame(res)
    res = res.dropna(subset=["name"]).reset_index()
    subset = ["ids", "name", "parent", "level"]
    res = res.drop_duplicates(subset=subset).sort_values(
        ["level", "name"]).reset_index()
    res = res[subset]
    res = res.sort_values('level').reset_index()[
        ["ids", "parent", "name", "level"]
    ].reset_index()
    res['id'] = res.apply(
        lambda x: x["ids"] if x["ids"] == x["ids"] else x["index"] + 50000,
        axis=1
    ).astype(int)
    res = res[["id", "parent", "name", "level"]]
    res["path"] = res["parent"].apply(lambda x: get_path(res, x))
    res = res.sort_values('id').reset_index()[
        ["id", "parent", "name", "level"]
    ].reset_index()
    res = res.replace({np.nan: None})
    for iv, v in enumerate(levels):
        filtered_res = res[res["level"] == iv]
        for i, r in enumerate(filtered_res.to_dict('records')):
            administration = Administration(
                id=r.get("id"),
                name=r.get("name"),
                parent=Administration.objects.filter(
                    id=r.get("parent")).first(),
                level=Levels.objects.filter(level=r.get("level")).first(),
                path=r.get("path"))
            administration.save()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)
        parser.add_argument("-c",
                            "--clean",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)

    def handle(self, *args, **options):
        test = options.get("test")
        clean = options.get("clean")
        if clean:
            Administration.objects.all().delete()
            self.stdout.write('-- Administration Cleared')
        if test:
            seed_administration_test()
        if not test:
            seed_administration_prod()
            self.stdout.write('-- FINISH')
