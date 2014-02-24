#!/bin/sh

APPNAME=drywall

if [ $(ps -e -o uid,cmd | grep $UID | grep node | grep -v grep | wc -l | tr -s "\n") -eq 0 ]
then
        export PATH=/usr/local/bin:$PATH
        forever start --sourceDir /home/webserver/$APPNAME/web.js >> /home/webserver/$APPNAME.log.txt 2>&1
fi
