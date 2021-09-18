# maulife assignment

## prerequisties

1. node >= v16.8.0
2. typescript
3. docker (optional for dev)

## run

development
```bash
# run postgres in docker with flyway
docker compose -f .local/docker-compose.yaml up postgresql flyway

# node with monitor changes
tsc -w&
nodemon .

# upload a csv
# $(md5 ...) depends on what platform/tools you have for generating md5
curl -v -H"x-checksum-md5: $(md5 tests/file1.csv | awk '{ print $4 }')" -XPOST localhost:8088/sales/record -F "file=@tests/file1.csv"
```

docker
```
# build
docker compose -f .local/docker-compose.yaml build test

# run
docker compose -f .local/docker-compose.yaml run test
```