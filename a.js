// Reusable function to fetch data from a MySQL table based on a date
function fetchDataByDate(req, res, pageName, tableName) {
    const selectedDate = req.query.date || getCurrentDate(); // Get the selected date from the query parameters or use the current date as a default
  
    // Check if a date was selected
    if (selectedDate) {
      // Modify the SQL query to fetch data for the selected date
      const query = `SELECT * FROM ${tableName} WHERE date = ?`; // Adjust the query as needed
  
      connection.query(query, [selectedDate], (err, results) => {
        if (err) throw err;
  
        res.render(pageName, { tableName: results, duplicateMessage: null });
      });
    } else {
      // If no date is selected, fetch data for the current date
      const currentDate = getCurrentDate(); // Get the current date
      connection.query(`SELECT * FROM ${tableName} WHERE date = ?`, [currentDate], (err, results) => {
        if (err) throw err;
  
        res.render(pageName, { tableName: results, duplicateMessage: null });
      });
    }
  }
  
  // Usage example for fetching data from 'obpt_data' table with 'date' column in 'database1'
  app.get('/obpt', checkAuth, (req, res) => {
    fetchDataByDate(req, res, 'obpt', 'obpt_data');
  });
  
 
  