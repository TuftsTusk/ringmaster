#!/bin/sh
$?=5
while [ $? -ne 0 ]; do curl -q 127.0.0.1:3000/alive; done
