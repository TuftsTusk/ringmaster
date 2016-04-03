#!/bin/bash
cp seed.js _seed.js
printf "ENV=\"${NODE_ENV}\";\nseed();\n" >> _seed.js
node _seed.js -- test argument 123 4567
rm _seed.js
