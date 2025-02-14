UPDATE
    $ { schemaId }.media
SET
    state = 'DONE', 
    done_time = $ { now },
    done_at = to_timestamp($ { now } / 1000),
    progress = 100
WHERE
    type = 'VIDEO'
    and id = '${mediaId}';