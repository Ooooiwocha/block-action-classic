CREATE TABLE push_subscriptions (endpoint TEXT PRIMARY KEY NOT NULL, created INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE push_state (id INTEGER PRIMARY KEY NOT NULL, last_sent INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
INSERT INTO push_state (id,last_sent) VALUES (1,0);
