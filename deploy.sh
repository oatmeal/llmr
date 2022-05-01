set -e
set -x

git clone --branch master "https://$DEPLOY_GITHUB_USER:$DEPLOY_GITHUB_TOKEN@github.com/oatmeal/llmr.git" ./build

cp -r deploy/. build

if [ "$github_repo" = "oatmeal/llmr" -a "$github_ref" = "refs/heads/main" ]; then
  cd build/
  git config user.email "1713553+oatmeal@users.noreply.github.com"
  git config user.name "pupu-bot"
  git add -A .
  git diff-index HEAD
  git diff-index --quiet HEAD || { git commit -m "deploy site from $git_hash" && git push; }
fi
