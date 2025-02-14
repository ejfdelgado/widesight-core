UPDATE
    $ { schemaId }.media
SET
    file_size_bytes = $ { media.file_size_bytes },
    extension = '${media.extension|sanitizeText}',
    original_file_name = '${media.original_file_name|sanitizeText}',
    mime_type = '${media.mime_type|sanitizeText}',
    -- Same pattern must match srv/wideSight/VideosService.mjs in objectPath
    source_url = 'videos/${accountId}/${media.id}.${media.extension|sanitizeText}',
    state = 'UPLOADED',
    progress = 0
WHERE
    type = 'VIDEO'
    and id = '${media.id}';