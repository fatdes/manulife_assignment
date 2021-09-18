CREATE SEQUENCE record_seq START 100001;
CREATE TABLE record (
  id                  TEXT                     NOT NULL DEFAULT 'RECORD-'::text || nextval('record_seq'::regclass),
  username            TEXT                     NOT NULL,
  age                 INTEGER                  NOT NULL,
  height              INTEGER                  NOT NULL,
  gender              TEXT                     NOT NULL,
  amount              INTEGER                  NOT NULL,
  last_purchase_date  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY   (id)
);
ALTER SEQUENCE record_seq OWNED BY record.id;
