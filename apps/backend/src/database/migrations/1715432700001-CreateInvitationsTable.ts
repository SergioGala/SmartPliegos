import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationsTable1715432700001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" UUID NOT NULL,
        "invitedByUserId" UUID,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'ACCEPTED')),
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_invitations_organization
          FOREIGN KEY ("organizationId")
          REFERENCES organizations(id) ON DELETE CASCADE,

        CONSTRAINT fk_invitations_invited_by
          FOREIGN KEY ("invitedByUserId")
          REFERENCES users(id) ON DELETE SET NULL,

        CONSTRAINT check_email_format
          CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$')
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations("organizationId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invitations CASCADE;`);
  }
}
