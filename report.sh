#!/usr/bin/env bash
# shellcheck disable=SC2155

gituser=$(git config --get user.name)
therepo=$(git config --get remote.origin.url | cut -d '/' -f 2 | sed s/\.git//g)
echo "### FULL DIFF $(date +%d-%m-%Y)" > ~/.standup-message
echo "#### Repo: https://github.com/akvo/$therepo" >> ~/.standup-message
git --no-pager log --all --decorate=short --pretty=format:"- %cd %s" --since="$(date -v -1d +%d-%m-%Y)" --date=format:'%d-%m-%Y [%H:%M]' --author="$gituser" --reverse \
    | sed 's/\[#\([0-9]*\)\]/\[#\1\]\(https:\/\/github.com\/akvo\/therepo\/issues\/\1\)/' \
    | sed "s|therepo|$therepo|g" \
    | sed 's/\"//g' | sed 's/\ \#/\#/g' | sed 's/\&/\ and\ /g' | sed 's/\ \ /\ /g'>> ~/.standup-message
message=$(cat ~/.standup-message)
echo "$message"
echo "Send it now ? [y]"
read -r answer
if [[ $(cat ~/.standup) == $(date +%j) && "$answer" == 'y' ]]; then
    echo "You've already sent it for today!"
elif [[ "$answer" == 'y' ]]; then
    date +%j > ~/.standup
    curl -X POST https://akvo.zulipchat.com/api/v1/messages \
        -u "${ZULIP_CLI_TOKEN}" \
        -d "type=stream" \
        -d "to=RTMIS" \
        -d "topic=Github" \
        -d "content=${message}"
    echo "-----------------------"
    echo "Message sent"
else
    echo "Abort message"
fi

