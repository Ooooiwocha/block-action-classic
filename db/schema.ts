// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,integer,text,index} from 'drizzle-orm/sqlite-core';
export const stages=sqliteTable('stages',{
 country:text('country'),
 pickup:integer('pickup').notNull().default(0),
 id:integer('id').primaryKey({autoIncrement:true}),title:text('title').notNull(),name:text('name').notNull(),comment:text('comment').notNull(),cells:text('cells').notNull(),password:text('password').notNull(),valid:integer('valid').notNull().default(1),demo:integer('demo').notNull().default(0),created:text('created').notNull(),deleted:integer('deleted').notNull().default(0),pn:integer('pn').notNull().default(0),dn:integer('dn').notNull().default(0),cn:integer('cn').notNull().default(0),retn:integer('retn').notNull().default(0),good:integer('good').notNull().default(0),bad:integer('bad').notNull().default(0),
});
export const comments=sqliteTable('comments',{connectionId:text('connection_id'),browserId:text('browser_id'),vpn:integer('vpn').notNull().default(0),id:integer('id').primaryKey({autoIncrement:true}),stageId:integer('stage_id').notNull(),name:text('name').notNull(),comment:text('comment').notNull(),created:text('created').notNull()},t=>[index('idx_comments_stage_id').on(t.stageId)]);
export const scores=sqliteTable('scores',{id:integer('id').primaryKey({autoIncrement:true}),stageId:integer('stage_id').notNull(),name:text('name').notNull(),time:integer('time').notNull()},t=>[index('idx_scores_stage_time').on(t.stageId,t.time)]);

export const pushSubscriptions=sqliteTable('push_subscriptions',{endpoint:text('endpoint').primaryKey(),created:integer('created').notNull()});
export const pushState=sqliteTable('push_state',{id:integer('id').primaryKey(),lastSent:integer('last_sent').notNull().default(0)});
