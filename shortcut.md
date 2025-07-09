To Start the whole service
docker-compose up -d

To flush the redis
docker exec -it translayze-redis redis-cli FLUSHDB
