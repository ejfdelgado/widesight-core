UPDATE
    $ { schemaId }.media
SET
    state = ${object.media.state|sanitizeTextNull}
WHERE
    type = 'VIDEO'
    and id = '${mediaId}';