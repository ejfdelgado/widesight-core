-- Object

CREATE TABLE IF NOT EXISTS ${schemaId}.object
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    media_id uuid NOT NULL,
    media_type character varying(8) COLLATE pg_catalog."default" NOT NULL,
    object_type_id character varying(128) COLLATE pg_catalog."default" NOT NULL,
    object_type_name character varying(256) COLLATE pg_catalog."default",
    media_source_url character varying(2048) COLLATE pg_catalog."default",
    media_start_at timestamp without time zone,
    media_start_time bigint,
    media_end_at timestamp without time zone,
    media_end_time bigint,
    created_time bigint,
    created_at timestamp without time zone,
    thumbnail character varying(2048) COLLATE pg_catalog."default",
    source_url character varying(2048) COLLATE pg_catalog."default",
    frame_width bigint,
    frame_height bigint,
    image_bbox_x1 numeric(6,5),
    image_bbox_y1 numeric(6,5),
    image_bbox_x2 numeric(6,5),
    image_bbox_y2 numeric(6,5),
    image_bbox_score numeric(8,4),
    speaker character varying(32) COLLATE pg_catalog."default",
    text character varying(1024) COLLATE pg_catalog."default",
    text_score numeric(8,4),
    account_id uuid NOT NULL,
    account_name character varying(128) COLLATE pg_catalog."default",
    app_id uuid NOT NULL,
    app_name character varying(512) COLLATE pg_catalog."default",
    CONSTRAINT object_pkey PRIMARY KEY (id),
    CONSTRAINT object_account_fk FOREIGN KEY (account_id)
        REFERENCES general.account (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT object_app_fk FOREIGN KEY (app_id)
        REFERENCES ${schemaId}.app (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT object_media_fk FOREIGN KEY (media_id, media_type)
        REFERENCES ${schemaId}.media (id, type) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT object_type_fk FOREIGN KEY (object_type_id)
        REFERENCES general.object_type (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS ${schemaId}.object
    OWNER to "${authorization_user}";