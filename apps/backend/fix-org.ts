import { AppDataSource } from './src/database/data-source';

async function run() {
  await AppDataSource.initialize();
  await AppDataSource.query(`UPDATE users SET "organizationId" = '5f2da4be-659d-44f7-876d-b5f616169cce' WHERE id='66e53649-265d-42c7-827e-1332d9ceba80'`);
  await AppDataSource.query(`INSERT INTO organization_members ("organizationId", "userId", role) VALUES ('5f2da4be-659d-44f7-876d-b5f616169cce', '66e53649-265d-42c7-827e-1332d9ceba80', 'OWNER')`);
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
