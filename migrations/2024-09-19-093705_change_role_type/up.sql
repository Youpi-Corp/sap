-- Your SQL goes here
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users ADD COLUMN role bit(4) DEFAULT B'0000';
