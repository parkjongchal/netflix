import { MigrationInterface, QueryRunner } from "typeorm";

export class Chat1736912595762 implements MigrationInterface {
    name = 'Chat1736912595762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, "message" character varying NOT NULL, "authorId" integer, "chatRoomId" integer, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_room" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, CONSTRAINT "PK_8aa3a52cf74c96469f0ef9fbe3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_room_users_user" ("chatRoomId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_78b0004f767c1273a6d13c1220b" PRIMARY KEY ("chatRoomId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4abf95f2b061eff07204eb6928" ON "chat_room_users_user" ("chatRoomId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fc13654c02f47079cdd00935b" ON "chat_room_users_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "FK_ac7ca6f6fbe56f2a231369f2171" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "FK_e49029a11d5d42ae8a5dd9919a2" FOREIGN KEY ("chatRoomId") REFERENCES "chat_room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_room_users_user" ADD CONSTRAINT "FK_4abf95f2b061eff07204eb69288" FOREIGN KEY ("chatRoomId") REFERENCES "chat_room"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_room_users_user" ADD CONSTRAINT "FK_8fc13654c02f47079cdd00935b7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_room_users_user" DROP CONSTRAINT "FK_8fc13654c02f47079cdd00935b7"`);
        await queryRunner.query(`ALTER TABLE "chat_room_users_user" DROP CONSTRAINT "FK_4abf95f2b061eff07204eb69288"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "FK_e49029a11d5d42ae8a5dd9919a2"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "FK_ac7ca6f6fbe56f2a231369f2171"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fc13654c02f47079cdd00935b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4abf95f2b061eff07204eb6928"`);
        await queryRunner.query(`DROP TABLE "chat_room_users_user"`);
        await queryRunner.query(`DROP TABLE "chat_room"`);
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}
