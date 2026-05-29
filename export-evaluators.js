const mysql = require('./backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'observabilidad',
  });

  try {
    const [rows] = await connection.execute(`
      SELECT
        id,
        name,
        description,
        prompt_template AS promptTemplate,
        feedback_key AS feedbackKey,
        model,
        score_description AS scoreDescription,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM evaluators
      ORDER BY id ASC
    `);

    console.log(`✓ Se encontraron ${rows.length} evaluadores`);

    const outputPath = path.join(__dirname, 'evaluadores.json');
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf-8');
    console.log(`✓ Guardado en: ${outputPath}`);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
