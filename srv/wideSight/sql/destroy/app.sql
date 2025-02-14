-- Destroy app
DELETE FROM
    $ { schemaId }.app
WHERE
    id = '${appId}';