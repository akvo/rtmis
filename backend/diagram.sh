#!/usr/bin/env bash
# shellcheck disable=SC2155

# apt update
# apt install graphviz
# pip install pydotplus
# pip install pygraphviz
python manage.py graph_models -a \
    -t 'django2018' \
    --arrow-shape 'normal' \
    -l neato --rankdir "TB" \
    -o ./diagram.png
