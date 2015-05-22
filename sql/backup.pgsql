DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS arrowclicked CASCADE;
DROP TABLE IF EXISTS coinclicked CASCADE;
DROP TABLE IF EXISTS keyboardevent CASCADE;
DROP TABLE IF EXISTS resetclicked CASCADE;
DROP TABLE IF EXISTS previousnextclicked CASCADE;
DROP TABLE IF EXISTS hovered CASCADE;

DROP TYPE IF EXISTS VECTOR3 CASCADE;
DROP TYPE IF EXISTS CAMERA CASCADE;
DROP TYPE IF EXISTS PREVIOUSNEXT CASCADE;

CREATE TYPE PREVIOUSNEXT AS ENUM(
    'p', 'n'
);

CREATE TYPE VECTOR3 AS(
    x REAL,
    y REAL,
    z REAL
);

CREATE TYPE CAMERA AS(
    position VECTOR3,
    target VECTOR3
);

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name CHAR(50)
);

CREATE TABLE arrowclicked(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    time TIMESTAMP DEFAULT NOW(),
    arrow_id INTEGER
);

CREATE TABLE coinclicked(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    time TIMESTAMP DEFAULT NOW(),
    coin_id INTEGER
);

CREATE TABLE keyboardevent(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    time TIMESTAMP DEFAULT NOW(),
    camera CAMERA
);

CREATE TABLE resetclicked(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE previousnextclicked(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    previousnext PREVIOUSNEXT NOT NULL,
    time TIMESTAMP DEFAULT NOW(),
    camera CAMERA
);

CREATE TABLE hovered(
    id SERIAL PRIMARY KEY,
    user_id SERIAL REFERENCES users (id),
    start BOOLEAN NOT NULL,
    time TIMESTAMP DEFAULT NOW(),
    arrow_id INT
);
