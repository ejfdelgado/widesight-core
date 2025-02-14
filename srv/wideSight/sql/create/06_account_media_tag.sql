-- Media Tag

CREATE TABLE IF NOT EXISTS ${schemaId}.media_tag
(
    media_id uuid NOT NULL,
    media_type character varying(8) COLLATE pg_catalog."default",
    tag character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT media_tag_pkey PRIMARY KEY (media_id, tag),
    CONSTRAINT media_tag_media_fk FOREIGN KEY (media_id, media_type)
        REFERENCES ${schemaId}.media (id, type) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE IF EXISTS ${schemaId}.media_tag
    OWNER to "${authorization_user}";