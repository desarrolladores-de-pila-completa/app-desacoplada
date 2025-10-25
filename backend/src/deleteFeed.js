const { pool } = require('./middlewares/db');

async function deleteFeed() {
  try {
    const [result] = await pool.query("DELETE FROM feed WHERE mensaje LIKE '%/pagina/1%'");
    console.log('Deleted feed entries:', result.affectedRows);
  } catch (err) {
    console.error('Error deleting feed:', err);
  } finally {
    process.exit();
  }
}

deleteFeed();