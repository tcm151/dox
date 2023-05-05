#!/bin/bash

# exit if there are any failures
set -e

{
	# only run if --build is included
	if [[ "$*" == *--build ]]; then	
   		# pull latest changes
   		git pull
   		# update packages and build
   		yarn install && yarn build
   		# kill running server
   		kill $(lsof -t -i :8001) 2>/dev/null || true
   		# delete production folder if it exists
   		if [ -d ".production" ]; then
   			rm -r .production
   			echo "Deleted production folder..."
   		fi
   		# copy build to production
   		cp -r .output .production
   		echo "Replaced production with build output"
   		# symlink image uploads to production
   		ln -s ~/dox/images ~/dox/.production/images
   		echo "Linked image upload directory to production"
	else
    	# kill running server
    	kill $(lsof -t -i :8001) 2>/dev/null || true
	fi
} | tee logs/build.log

# start server in the background and direct output to log
exec nohup yarn start:production >logs/server.log 2>logs/error.log &

echo "Server deployed successfully..."
exit 0
