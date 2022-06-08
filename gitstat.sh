#!/bin/bash

# git fetch --all
# git pull --all

get_contributor() {
    git log --format='%aN' \
        | grep -v "root" \
        | grep -v "abhishek_p_s" \
        | grep -v "Deden Bangkit" \
        | grep -v "nirav9spl" \
        | grep -v "bhavin" \
        | sort -u
}

contributors=$(get_contributor)

if [ $# -eq 1 ]; then
    contributors=$(echo "${contributors}" | grep "$1")
fi

while read -r contributor; do
    echo ""
    echo "### Contributor: ${contributor}"
    git log --author="${contributor}" --pretty=tformat: --numstat \
        | grep -v "migrations" \
        | grep -v "__snapshots__" \
        | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "Added Lines: %s, Removed Lines: %s, Total Lines: %s\n", add, subs, loc }' -
    echo ""
    git --no-pager log --reverse --author="${contributor}" --no-merges --pretty=format:"- [%Cblue%cd%Creset] %Cred%cn%Creset %s" --date=format:'%d %h %H:%M'
    echo ""
    echo ""
    echo "----------------------------------------------------------------"
done < <(echo "${contributors}")
