import json

import numpy as np
import pandas as pd
from django.core.management import BaseCommand
from faker import Faker

from api.v1.v1_profile.models import Levels, Administration

geo_config = [{
    "level": 0,
    "name": "NAME_0",
    "alias": "National"
}, {
    "level": 1,
    "name": "NAME_1",
    "alias": "County"
}, {
    "level": 2,
    "name": "NAME_2",
    "alias": "Sub-County"
}, {
    "level": 3,
    "name": "NAME_3",
    "alias": "Ward"
}]

source_file = './source/kenya.topojson'


def get_parent_id(df, x):
    if x["level"] == 0:
        return None
    parent_level = x["level"] - 1
    pid = df[(df["level"] == parent_level) & (df["name"] == x["p"])]
    pid = pid.to_dict("records")[0]
    return pid["id"]


def seed_administration_test():
    fake = Faker()
    level = Levels(name="country", level=1)
    level.save()
    level_2 = Levels(name=fake.company(), level=2)
    level_2.save()
    level_3 = Levels(name=fake.company(), level=3)
    level_3.save()
    administration = Administration(id=1,
                                    name="Indonesia",
                                    parent=None,
                                    level=level)
    administration.save()
    administration = Administration(id=2,
                                    name="Jakarta",
                                    parent=administration,
                                    level=level,
                                    path='{0}.'.format(administration.id))
    administration.save()
    administration = Administration(id=3,
                                    name=fake.company(),
                                    parent=administration,
                                    level=level_2,
                                    path='{0}{1}.'.format(
                                        administration.path,
                                        administration.id))
    administration.save()
    administration = Administration(id=4,
                                    name=fake.company(),
                                    parent=administration,
                                    level=level_3,
                                    path='{0}{1}.'.format(
                                        administration.path,
                                        administration.id))
    administration.save()


def get_path(df, parent, current=[]):
    p = df[df['id'] == parent]
    current = current + list(p['id'])
    if p.shape[0]:
        return get_path(df, list(p['parent'])[0], current)
    current.reverse()
    path = ".".join([str(c) for c in current])
    if len(path):
        return f"{path}."
    return None


def seed_administration_prod():
    geo = open(source_file, 'r')
    geo = json.load(geo)
    ob = geo["objects"]
    ob_name = list(ob)[0]
    levels = [c["name"] for c in geo_config]
    properties = [
        d for d in [p["properties"] for p in ob[ob_name]["geometries"]]
    ]
    level_list = [
        Levels(id=(i + 1), name=g.get("alias"), level=g.get("level"))
        for i, g in enumerate(geo_config)
    ]
    Levels.objects.bulk_create(level_list)
    df = pd.DataFrame(properties)
    rec = df[levels].to_dict("records")
    res = []
    for i, r in enumerate(rec):
        for iv, v in enumerate(levels):
            lv = list(filter(lambda x: x["name"] == v, geo_config))[0]["level"]
            plv = None
            if lv > 0:
                plv = r[levels[iv - 1]]
            data = {
                "name": r[v],
                "p": plv,
                "level": lv,
            }
            res.append(data)
    res = pd.DataFrame(res)
    res = res.dropna(subset=["name"]).reset_index()
    subset = ["name", "p", "level"]
    res = res.drop_duplicates(subset=subset).sort_values(["level", "name"
                                                          ]).reset_index()
    res = res[subset]
    res["id"] = res.index + 1
    res["parent"] = res.apply(lambda x: get_parent_id(res, x), axis=1)
    res = res[["id", "parent", "name", "level"]]
    res["path"] = res["parent"].apply(lambda x: get_path(res, x))
    res = res.replace({np.nan: None})
    res = res.to_dict('records')
    for r in res:
        administration = Administration(
            id=r.get("id"),
            name=r.get("name"),
            parent=Administration.objects.filter(id=r.get("parent")).first(),
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
            # if Administration.objects.count():
            #    self.stdout.write("You have performed administration seeder")
            #    exit()
            Levels.objects.all().delete()
            seed_administration_prod()
            self.stdout.write('-- FINISH')
