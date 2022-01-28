## RESOURCES & NOTES

1. [Design](https://xd.adobe.com/view/26c48557-3a9c-40c6-a370-f4af7991c47a-7397/screen/d04a4230-78b9-422f-8c13-142e609b13a8/specs/), Adobe
2. [Form and Data Workflow](https://app.excalidraw.com/l/2tVeGVHqKIQ/1ktf3ES2YYn), Excalidraw
3. [DB Design](https://dbdocs.io/deden/rtmis), DBdocs
4. [DB Model](https://dbdocs.io/deden/rtmis-django), DBdocs
5. [TopoJSON](https://github.com/akvo/rtmis/blob/main/doc/resource/kenya.topojson) and [GeoJSON](https://github.com/akvo/rtmis/blob/main/doc/resource/kenya.geojson) Resources

## SCRIPTS

### Generate Administration

```
./scripts/generate_administration.sh <output_file>.csv
```

### Generate and Update DBDocs

Note that you should have an account in [dbdocs.io](https://dbdocs.io/) and install dbdocs CLI

```
./scripts/generate_dbml.sh
```
