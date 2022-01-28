#!/usr/bin/env bash

ROOT_DIR=$(git rev-parse --show-toplevel)

if [ $# -eq 0 ] ; then
    echo 'You should define the destination file'
    echo './generate_administration.sh <path_to_output_file>.csv'
    exit
fi

docker run -i stedolan/jq -r '[.objects.kenya.geometries[]?.properties]
    | (.[0] | keys_unsorted) as $keys
    | $keys, map([.[ $keys[] ]])[]
    | @csv' < "$ROOT_DIR"/doc/resource/kenya.topojson > "$@"
