#!/bin/bash
cp purge.js _purge.js
printf "ENV=\"${NODE_ENV}\";\npurge();\n" >> _purge.js 
mongo _purge.js
rm _purge.js
