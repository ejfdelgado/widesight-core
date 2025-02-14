UPDATE
    $ { schemaId }.media
SET
    progress = ${object.progress}
WHERE
    type = 'VIDEO'
    and id = '${mediaId}';