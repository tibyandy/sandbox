#!/usr/bin/env bash

mvn clean install

./scripts/links-hotdeploy.sh

mvn appengine:devserver
