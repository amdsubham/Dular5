#!/bin/bash
# Wrapper script for EAS Build prebuildCommand
# Ignores all arguments passed by EAS and runs the postinstall script

node "$(dirname "$0")/postinstall.js"
