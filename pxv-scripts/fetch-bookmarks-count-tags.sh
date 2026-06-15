# ./fetch-bookmarks-count-tags.sh > fetch-bookmarks-count-tags.txt
sort fetch-bookmarks-2026-05-21-tags-not-hidden-omit-users.txt | uniq -c | sort -nr