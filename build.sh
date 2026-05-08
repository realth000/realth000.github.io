#!/bin/bash

set -ex

BLOG_DIR="./miko-blog"
DOC_DIR="${BLOG_DIR}/src/contents"

cp assets/logo.png "${BLOG_DIR}/src/assets/logo.png"
cp assets/logo.svg "${BLOG_DIR}/public/logo.svg"
cp about.mdx "${BLOG_DIR}/src/values/about.mdx"
cp whispers.mdx "${BLOG_DIR}/src/values/whispers.mdx"
cp config-value.ts "${BLOG_DIR}/src/values/config-value.ts"
[ ! -d "${DOC_DIR}" ] && mkdir "${DOC_DIR}"
cp -r blogs/* "${DOC_DIR}"

pushd "${BLOG_DIR}"

pnpm install

pnpm gen-doc

pnpm build

popd
