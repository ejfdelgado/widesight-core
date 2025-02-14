-- App / Media many to many

CREATE TABLE IF NOT EXISTS ${schemaId}.app_media
(
    app_id uuid NOT NULL,
    media_id uuid NOT NULL,
    media_type character varying(8) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT app_media_pkey PRIMARY KEY (app_id, media_id, media_type),
    CONSTRAINT app_media_fk1 FOREIGN KEY (app_id)
        REFERENCES ${schemaId}.app (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT app_media_fk2 FOREIGN KEY (media_id, media_type)
        REFERENCES ${schemaId}.media (id, type) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS ${schemaId}.app_media
    OWNER to "${authorization_user}";