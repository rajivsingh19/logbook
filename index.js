const express = require('express');
const path = require('path')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
//for excel worksheet
const excel = require('exceljs');
//const ejs = require('ejs');
const app = express();
app.use(express.json());
const port = 3001;
// Set up the view engine
app.set('view engine', 'ejs');
// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/public'));
//app.use('/js', express.static(path.join(_dirname, 'node_modules/bootstrap/dist/js')))
//app.use('/js', express.static(path.join(_dirname, 'node_modules/jquery/dist')))


// MySQL database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'logbook',
};

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your_secret_key', // Replace with a random secret key for session encryption
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to check if the user is logged in
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  } else {
    next();
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('login');
});
//for username and password fields
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query the database to check if the provided credentials match any user
  connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 1) {
      // Set the 'user' property in the session to indicate the user is logged in
      req.session.user = results[0];
      res.redirect('/index');
    } else {
      res.send('Invalid username or password');
    }
  });
});


//routes
app.get('/index', checkAuth, (req, res) => {
  // Fetch users and roles from the database and render the index page
  connection.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).send('Internal Server Error');
    }
    connection.query('SELECT * FROM group_detail where groupid=1', (err, roles) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render('home', { users, roles });
    });
  });
});
app.get('/home', checkAuth, (req, res) => {
  res.render('home'); // Render the "home.ejs" template
});
app.get('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});


// Create a MySQL connection
const connection = mysql.createConnection(dbConfig);

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Route: Homepage
app.get('/', (req, res) => {
  // Fetch users from the database
  connection.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Fetch roles from the database
    connection.query('SELECT * FROM group_detail where groupid=1', (err, roles) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render('index', { users, roles });
    });
  });
});

app.get('/users', checkAuth, (req, res) => {
  // Fetch users from the database
  connection.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Fetch roles from the database
    connection.query('SELECT * FROM group_detail where groupid=1', (err, roles) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render('users', { users, roles });
    });
  });
});

app.get('/roles', checkAuth, (req, res) => {
  // Fetch users from the database
  connection.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Fetch roles from the database
    connection.query('SELECT * FROM group_detail where groupid=1', (err, roles) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render('roles', { users, roles });
    });
  });
});


// Route: Add User
app.post('/users', (req, res) => {
  const { username, role } = req.body;
  const user = { username, role: role };
  connection.query('INSERT INTO users SET ?', user, (err) => {
    if (err) {
      console.error('Error adding user:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/users');
  });
});

// Route: Delete User
app.post('/users/:id/delete', (req, res) => {
  const userId = req.params.id;
  connection.query('DELETE FROM users WHERE id = ?', userId, (err) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/users');
  });
});

// Route: Edit User
app.post('/users/:id/edit', (req, res) => {
  const userId = req.params.id;
  const { username, roleId } = req.body;
  const user = { username, role: roleId };
  connection.query('UPDATE users SET ? WHERE id = ?', [user, userId], (err) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/users');
  });
});

//OBPT excel sheet
app.get('/obpt-excel', checkAuth, async (req, res) => {
  try {
    // Fetch the data you want to export from your database
    // For example, you can fetch data from the 'HOT_METAL_SLAG' table
    const query = 'SELECT * From obpt_data'; // Adjust the query as needed

    connection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Create a new Excel workbook and worksheet
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Logbook Data');

      // Define the columns for the worksheet (adjust as per your data)
      const columns = [
        { header: 'Date', key: 'date', width: 12 }, 'Time', 'THL', 'ETA', 'Probe1_TC1', 'Probe1_TC2', 'Probe1_TC3', 'Probe1_TC4',
        'Probe1_TC5', 'Probe2_TC6', 'Probe2_TC7', 'Probe2_TC8', 'Probe2_TC9', 'Probe2_TC10',
        'Bosh_1', 'Bosh_2', 'Bosh_3', 'Belly_1', 'Belly_2', 'Belly_3', 'Lower_1', 'Lower_2',
        'Lower_3', 'Mid_1', 'Mid_2', 'Mid_3'
       ].map(header =>  (typeof header === 'string' ? { header, key: header.toLowerCase() } : header));
      
      worksheet.columns = columns;
      
      worksheet.columns = columns;

      // Automatically adjust column width based on column headings
       columns.slice(1).forEach((column, index) => {
       worksheet.getColumn(index + 2).width = column.header.length + 2;
      });
        
      // Lock the worksheet to make it non-editable
      worksheet.protect();
  
        // Add data rows to the worksheet
        results.forEach((row) => {
          worksheet.addRow(row);
        });
  
        // Generate a unique filename for the Excel file
        const fileName = `logbook_obptData_${new Date().toISOString()}.xlsx`;
  
        // Set response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  
        // Pipe the workbook to the response
        await workbook.xlsx.write(res);
        res.end();
      });
    } catch (error) {
      console.error('Error exporting data to Excel:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  // app.get('/obpt', checkAuth, (req, res) => {
  //   const selectedDate = req.query.date || getCurrentDate(); // Get the selected date from the query parameters or use the current date as a default
    
  //   // Check if a date was selected
  //   if (selectedDate) {
  //     // Modify the SQL query to fetch data for the selected date
  //     const query = 'SELECT * FROM obpt_data WHERE date = ?'; // Adjust the query as needed
  
  //     connection.query(query, [selectedDate], (err, results) => {
  //       if (err) throw err;
  
  //       res.render("obpt", { obpt_data: results, duplicateMessage: null });
  //     });
  //   } else {
  //     // If no date is selected, fetch data for the current date
  //     const currentDate = getCurrentDate(); // Get the current date
  //     connection.query("SELECT * FROM obpt_data WHERE date = ?", [currentDate], (err, results) => {
  //       if (err) throw err;
  
  //       res.render("obpt", { obpt_data: results, duplicateMessage: null });
  //     });
  //   }
  // });

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


app.get('/obpt', checkAuth, (req, res) => {
  fetchDataByDate(req, res, 'obpt', 'obpt_data');
});
app.get('/bfpp', checkAuth, (req, res) => {
  fetchDataByDate(req, res, 'bfpp', 'blast_furnace_data');
});
app.get('/gcp_wtp', checkAuth, (req, res) => {
  fetchDataByDate(req, res, 'gcp_wtp', 'GCP_AND_WTP');
});
app.get('/HOT_METAL_SLAG', checkAuth, (req, res) => {
  fetchDataByDate(req, res, 'HOT_METAL_SLAG', 'HOT_METAL_SLAG');
});



  
  // Function to get the current date in the format 'YYYY-MM-DD'
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

//OBPT data functions routing
app.get('/obpt', checkAuth, (req, res) => {
 
  connection.query("SELECT * FROM obpt_data", (err, results) => {
    if (err) throw err;
   
    res.render("obpt", { obpt_data: results, duplicateMessage: null});
  });
   
    });

app.post('/add-obpt', (req, res) => {
  const { date, time, thl, eta, probe1_tc1, probe1_tc2, probe1_tc3, probe1_tc4, probe1_tc5, probe2_tc6, probe2_tc7, probe2_tc8, probe2_tc9, probe2_tc10, bosh_1, bosh_2, bosh_3, belly_1, belly_2, belly_3, lower_1, lower_2, lower_3, mid_1, mid_2, mid_3} = req.body;
  const newUser = {  date, time, thl, eta, probe1_tc1, probe1_tc2, probe1_tc3, probe1_tc4, probe1_tc5, probe2_tc6, probe2_tc7, probe2_tc8, probe2_tc9, probe2_tc10, bosh_1, bosh_2, bosh_3, belly_1, belly_2, belly_3, lower_1, lower_2, lower_3, mid_1, mid_2, mid_3 };
  
connection.query('SELECT * FROM obpt_data WHERE date=? AND time=? ', [date,time], (err, results) => {
if (err) throw err;

if (results.length > 0) {
  console.log("Same data already exists in the database");
  res.render("obpt", {
    obpt_data: results,
   duplicateMessage: "Duplicate data already exists in the database.",
  });

}
else{
  connection.query('INSERT INTO obpt_data SET ?', newUser, (err, result) => {
    if (err) throw err;
    console.log('User added to the database');
   
     res.redirect('/obpt');
     });
    }
   }
  )
 });



 app.post('/update-obpt', (req, res) => {
  const { id, date, time, thl, eta, probe1_tc1, probe1_tc2, probe1_tc3, probe1_tc4, probe1_tc5, probe2_tc6, probe2_tc7, probe2_tc8, probe2_tc9, probe2_tc10, bosh_1, bosh_2, bosh_3, belly_1, belly_2, belly_3, lower_1, lower_2, lower_3, mid_1, mid_2, mid_3 } = req.body;
  const updatedData = { date, time, thl, eta, probe1_tc1, probe1_tc2, probe1_tc3, probe1_tc4, probe1_tc5, probe2_tc6, probe2_tc7, probe2_tc8, probe2_tc9, probe2_tc10, bosh_1, bosh_2, bosh_3, belly_1, belly_2, belly_3, lower_1, lower_2, lower_3, mid_1, mid_2, mid_3 };
  connection.query('UPDATE obpt_data SET ? WHERE id = ?', [updatedData, id], (err, result) => {
    if (err) throw err;
    console.log('Data updated in the database');
    res.redirect('/obpt');
  });
});
//BLAST FURNACE PROCESS PARAMETERS excel sheet
app.get('/bfpp-excel', checkAuth, async (req, res) => {
  try {
    // Fetch the data you want to export from your database
    // For example, you can fetch data from the 'HOT_METAL_SLAG' table
    const query = 'SELECT * From blast_furnace_data'; // Adjust the query as needed

    connection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Create a new Excel workbook and worksheet
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Logbook Data');

      // Define the columns for the worksheet (adjust as per your data)
      const columns = [
        { header: 'Date', key: 'date', width: 12 }, 'Time', 'No_of_charge', 'Comulative_charge', 'Radar_1', 'Radar_2', 'SR_3', 'Vol_x100',
        'BP_press', 'BP_temp', 'BP_steam', 'BP_OE', 'BP_OF', 'BP_PRT', 'BP_PRK', 'BP_MT', 'BP_RAFFT',
        'BP_Tuyere', 'TG_press', 'UT_1', 'UT_2', 'UT_3', 'UT_4', 'IA', 'OA', 'DAA', 'CG', 'HS',
        'PRIMARY', 'SECONDARY', 'IG', 'OG', 'OG_STOVE', 'OG_DOME', 'OG_FLUE', 'OG_Cobustion',
        'OG_BF', 'OB_STOVE', 'OB_DOME', 'OB_FLUE'
       ].map(header =>  (typeof header === 'string' ? { header, key: header.toLowerCase() } : header));
      
       worksheet.columns = columns;

       // Automatically adjust column width based on column headings
        columns.slice(1).forEach((column, index) => {
        worksheet.getColumn(index + 2).width = column.header.length + 2;
       });
         
       // Lock the worksheet to make it non-editable
       worksheet.protect();
   
         // Add data rows to the worksheet
         results.forEach((row) => {
           worksheet.addRow(row);
         });
   
         // Generate a unique filename for the Excel file
         const fileName = `logbook_bfppData_${new Date().toISOString()}.xlsx`;
   
         // Set response headers for Excel file download
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
         res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
   
         // Pipe the workbook to the response
         await workbook.xlsx.write(res);
         res.end();
       });
     } catch (error) {
       console.error('Error exporting data to Excel:', error);
       res.status(500).send('Internal Server Error');
     }
   });


//....for BLAST FURNACE PROCESS PARAMETERS routing.......
app.get("/bfpp", checkAuth, (req, res) => {
  connection.query("SELECT * FROM blast_furnace_data", (err, results) => {
    if (err) throw err;
   
    res.render("bfpp", { blast_furnace_data: results, duplicateMessage: null});
  });
});

//....for add in BLAST FURNACE PROCESS PARAMETERS..........
app.post('/add-bspl', (req, res) => {
  const { date, time, No_of_charge, comulative_charge, radar_1, radar_2, SR_3, vol_x100, BP_press, BP_temp, BP_steam, BP_OE, BP_OF, BP_PRT, BP_PRK, BP_MT, BP_RAFFT, BP_Tuyere, TG_press, UT_1, UT_2, UT_3, UT_4, IA, OA, DAA, CG, HS, PRIMARY, SECONDARY, IG, OG, OG_STOVE, OG_DOME, OG_FLUE, OG_Cobustion, OG_BF, OB_STOVE, OB_DOME, OB_FLUE
  } = req.body;
  const newData = {  date, time,  No_of_charge, comulative_charge, radar_1, radar_2, SR_3, vol_x100, BP_press, BP_temp, BP_steam, BP_OE, BP_OF, BP_PRT, BP_PRK, BP_MT, BP_RAFFT, BP_Tuyere, TG_press, UT_1, UT_2, UT_3, UT_4, IA, OA, DAA, CG, HS, PRIMARY, SECONDARY, IG, OG, OG_STOVE, OG_DOME, OG_FLUE, OG_Cobustion, OG_BF, OB_STOVE, OB_DOME, OB_FLUE };
  
connection.query(
  'SELECT * FROM blast_furnace_data WHERE date=? AND time=? ',
 [date,time],
 (err, results) => {
if (err) throw err;

if (results.length > 0) {
  console.log("Same data already exists in the database");
  res.render("index", {
    blast_furnace_data: results,
   duplicateMessage: "Duplicate data already exists in the database.",
  });

}
else{
  connection.query('INSERT INTO blast_furnace_data SET ?', newData, (err, result) => {
    if (err) throw err;
    console.log('Data added to the database');
   
     res.redirect('/bfpp');
     });
    }
   }
  )
 });

//.....for update in EXISTING BLAST FURNACE DATA.....
 app.post('/update-bspl', (req, res) => {
  const {id, date, time, No_of_charge, comulative_charge, radar_1, radar_2, SR_3, vol_x100, BP_press, BP_temp, BP_steam, BP_OE, BP_OF, BP_PRT, BP_PRK, BP_MT, BP_RAFFT, BP_Tuyere, TG_press, UT_1, UT_2, UT_3, UT_4, IA, OA, DAA, CG, HS, PRIMARY, SECONDARY, IG, OG, OG_STOVE, OG_DOME, OG_FLUE, OG_Cobustion, OG_BF, OB_STOVE, OB_DOME, OB_FLUE
  } = req.body;
  const updatedData = {  date, time,  No_of_charge, comulative_charge, radar_1, radar_2, SR_3, vol_x100, BP_press, BP_temp, BP_steam, BP_OE, BP_OF, BP_PRT, BP_PRK, BP_MT, BP_RAFFT, BP_Tuyere, TG_press, UT_1, UT_2, UT_3, UT_4, IA, OA, DAA, CG, HS, PRIMARY, SECONDARY, IG, OG, OG_STOVE, OG_DOME, OG_FLUE, OG_Cobustion, OG_BF, OB_STOVE, OB_DOME, OB_FLUE };
  
  connection.query('UPDATE blast_furnace_data SET ? WHERE id = ?', [updatedData, id], (err, result) => {
    if (err) throw err;
    console.log('Data updated in the database');
    res.redirect('/bfpp');
  });
});

//....for TUYERE OBSERVATION DETAILS....
app.post('/tuyere-bspl', (req, res) => {
  const { date_2, shift, shift_1, shift_2, shift_3, shift_4, shift_5, shift_6, shift_7, shift_8, shift_9, shift_10, shift_11, shift_12, shift_13, shift_14, shift_15, shift_16, shift_17, shift_18, shift_19, shift_20, shift_21, shift_22, shift_23, shift_24, shift_25, Observation_1, Observation_2, Observation_3 } = req.body;

   const addShift={ date_2, shift, shift_1, shift_2, shift_3, shift_4, shift_5, shift_6, shift_7, shift_8, shift_9, shift_10, shift_11, shift_12, shift_13, shift_14, shift_15, shift_16, shift_17, shift_18, shift_19, shift_20, shift_21, shift_22, shift_23, shift_24, shift_25, Observation_1, Observation_2, Observation_3
  };
  
   connection.query('INSERT INTO tuyereShift SET ?', addShift, (err, result) => {
    if (err) throw err;
    console.log('Data added to the database');
   
     res.redirect('/bfpp');
  });
});

//GCP_AND_WTP excel sheet
app.get('/gcpWtp-excel', checkAuth, async (req, res) => {
  try {
    // Fetch the data you want to export from your database
    // For example, you can fetch data from the 'HOT_METAL_SLAG' table
    const query = 'SELECT * From GCP_AND_WTP'; // Adjust the query as needed

    connection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Create a new Excel workbook and worksheet
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Logbook Data');

      // Define the columns for the worksheet (adjust as per your data)
      const columns = [
        { header: 'Date', key: 'date', width: 12 }, 'Time', 'tk_30_lit_8805', 'main_pump_running', 'gcp_spray_water_1',
  'gcp_spray_water_2', 'gcp_spray_water_3', 'gcp_spray_water_4', 'cp_30_outlet_temp',
  'flow_regulating_valve_position', 'prescrubber_level', 'demister_level',
  'recirculation_pump_1', 'recirculation_pump_2', 'recirculation_pump_3',
  'recirculation_pump_4', 'scrubber_a', 'scrubber_b', 'scrubber_c', 'scrubber_d',
  'uptake_pressure', 'ag_element_position', 'gcp_hydraulic_1', 'gcp_hydraulic_2',
  'gcp_hydraulic_3', 'greasing_pump_1', 'network_set_point', 'flaire_stack_valve',
  'lpg_ftc_9045', 'thickner', 'cooling_tower_fan_a', 'cooling_tower_fan_b',
  'bedmass', 'thickner_torque', 'sludge_tank_level', 'dosing_pump',
      ].map(header =>  (typeof header === 'string' ? { header, key: header.toLowerCase() } : header));
      
      worksheet.columns = columns;

    // Automatically adjust column width based on column headings
     columns.slice(1).forEach((column, index) => {
     worksheet.getColumn(index + 2).width = column.header.length + 2;
    });
      
    // Lock the worksheet to make it non-editable
    worksheet.protect();

      // Add data rows to the worksheet
      results.forEach((row) => {
        worksheet.addRow(row);
      });

      // Generate a unique filename for the Excel file
      const fileName = `logbook_GcpWtpData_${new Date().toISOString()}.xlsx`;

      // Set response headers for Excel file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

      // Pipe the workbook to the response
      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    console.error('Error exporting data to Excel:', error);
    res.status(500).send('Internal Server Error');
  }
});
//for GCP_WTP.....................
app.get("/gcp_wtp", checkAuth, (req, res) => {
  connection.query("SELECT * FROM GCP_AND_WTP", (err, results) => {
    if (err) throw err;
   
    res.render("gcp_wtp", { GCP_AND_WTP: results, duplicateMessage: null});
  });
});

//....for add in GCP & WTP..........
app.post('/add-GAW', (req, res) => {
  const { date, time, tk_30_lit_8805, main_pump_running, gcp_spray_water_1, gcp_spray_water_2, gcp_spray_water_3,
      gcp_spray_water_4, cp_30_outlet_temp, flow_regulating_valve_position, prescrubber_level,
      demister_level, recirculation_pump_1, recirculation_pump_2, recirculation_pump_3,
      recirculation_pump_4, scrubber_a, scrubber_b, scrubber_c, scrubber_d, uptake_pressure,
      ag_element_position, gcp_hydraulic_1, gcp_hydraulic_2, gcp_hydraulic_3,
      greasing_pump_1, network_set_point, flaire_stack_valve, lpg_ftc_9045,
      thickner, cooling_tower_fan_a, cooling_tower_fan_b,
      bedmass, thickner_torque, sludge_tank_level, dosing_pump
  } = req.body;

  // Construct the newData object
  const newData = { date, time, tk_30_lit_8805, main_pump_running, gcp_spray_water_1, gcp_spray_water_2, gcp_spray_water_3,
      gcp_spray_water_4, cp_30_outlet_temp, flow_regulating_valve_position, prescrubber_level,
      demister_level, recirculation_pump_1, recirculation_pump_2, recirculation_pump_3,
      recirculation_pump_4, scrubber_a, scrubber_b, scrubber_c, scrubber_d, uptake_pressure,
      ag_element_position, gcp_hydraulic_1, gcp_hydraulic_2, gcp_hydraulic_3,
      greasing_pump_1, network_set_point, flaire_stack_valve, lpg_ftc_9045,
      thickner, cooling_tower_fan_a, cooling_tower_fan_b,
      bedmass, thickner_torque, sludge_tank_level, dosing_pump
  };
connection.query(
  'SELECT * FROM GCP_AND_WTP WHERE date=? AND time=? ',
 [date,time],
 (err, results) => {
if (err) throw err;

if (results.length > 0) {
  console.log("Same data already exists in the database");
  res.render("index", {
    GCP_AND_WTP: results,
   duplicateMessage: "Duplicate data already exists in the database.",
  });

}
else{
  connection.query('INSERT INTO GCP_AND_WTP SET ?', newData, (err, result) => {
    if (err) throw err;
    console.log('Data added to the database');
   
     res.redirect('/');
     });
    }
   }
  )
 });

//.....for update in EXISTING BLAST FURNACE DATA.....
 app.post('/update-GAW', (req, res) => {
  const {id, date, time, tk_30_lit_8805, main_pump_running, gcp_spray_water_1, gcp_spray_water_2, gcp_spray_water_3,
      gcp_spray_water_4, cp_30_outlet_temp, flow_regulating_valve_position, prescrubber_level,
      demister_level, recirculation_pump_1, recirculation_pump_2, recirculation_pump_3,
      recirculation_pump_4, scrubber_a, scrubber_b, scrubber_c, scrubber_d, uptake_pressure,
      ag_element_position, gcp_hydraulic_1, gcp_hydraulic_2, gcp_hydraulic_3,
      greasing_pump_1, network_set_point, flaire_stack_valve, lpg_ftc_9045,
      thickner, cooling_tower_fan_a, cooling_tower_fan_b,
      bedmass, thickner_torque, sludge_tank_level, dosing_pump
  } = req.body;

  // Construct the newData object
  const updatedData = { date, time, tk_30_lit_8805, main_pump_running, gcp_spray_water_1, gcp_spray_water_2, gcp_spray_water_3,
      gcp_spray_water_4, cp_30_outlet_temp, flow_regulating_valve_position, prescrubber_level,
      demister_level, recirculation_pump_1, recirculation_pump_2, recirculation_pump_3,
      recirculation_pump_4, scrubber_a, scrubber_b, scrubber_c, scrubber_d, uptake_pressure,
      ag_element_position, gcp_hydraulic_1, gcp_hydraulic_2, gcp_hydraulic_3,
      greasing_pump_1, network_set_point, flaire_stack_valve, lpg_ftc_9045,
      thickner, cooling_tower_fan_a, cooling_tower_fan_b,
      bedmass, thickner_torque, sludge_tank_level, dosing_pump
  };
  connection.query('UPDATE GCP_AND_WTP SET ? WHERE id = ?', [updatedData, id], (err, result) => {
    if (err) throw err;
    console.log('Data updated in the database');
    res.redirect('/');
  });
});

//hot metal excel sheet
app.get('/hotMetalSlag-excel', checkAuth, async (req, res) => {
  try {
    // Fetch the data you want to export from your database
    // For example, you can fetch data from the 'HOT_METAL_SLAG' table
    const query = 'SELECT * From HOT_METAL_SLAG'; // Adjust the query as needed

    connection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Create a new Excel workbook and worksheet
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Logbook Data');

      // Define the columns for the worksheet (adjust as per your data)
      const columns = [
        { header: 'Date', key: 'date', width: 12 }, 'tapHole', 'castNo', 'length', 'openTime_1', 'slag_time', 'Vendor_Supplier',
  'ClosedTime_1', 'Duration', 'ClayPushed', 'DryOrNot', 'DrillBitUsed', 'LancingPipeUsed',
  'PockingRodUsed', 'hotMetalTemp', 'C', 'Si', 'S', 'Mn', 'P', 'Ti', 'Sio', 'Al2O3',
  'CaO', 'MgQ', 'FeO', 'MnO', 'K20', 'Na2O', 'S2', 'TiO2', 'B2', 'B3',
       ].map(header =>  (typeof header === 'string' ? { header, key: header.toLowerCase() } : header));
      
       worksheet.columns = columns;

       // Automatically adjust column width based on column headings
        columns.slice(1).forEach((column, index) => {
        worksheet.getColumn(index + 2).width = column.header.length + 2;
       });
         
       // Lock the worksheet to make it non-editable
       worksheet.protect();
   
         // Add data rows to the worksheet
         results.forEach((row) => {
           worksheet.addRow(row);
         });
   
         // Generate a unique filename for the Excel file
         const fileName = `logbook_HotMetalSlagData_${new Date().toISOString()}.xlsx`;
   
         // Set response headers for Excel file download
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
         res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
   
         // Pipe the workbook to the response
         await workbook.xlsx.write(res);
         res.end();
       });
     } catch (error) {
       console.error('Error exporting data to Excel:', error);
       res.status(500).send('Internal Server Error');
     }
   });


//For HOT METal And Slag.........
app.get("/HOT_METAL_SLAG", checkAuth, (req, res) => {
  connection.query("SELECT * FROM HOT_METAL_SLAG", (err, results) => {
    if (err) throw err;
   
    res.render("HOT_METAL_SLAG", { HOT_METAL_SLAG: results, duplicateMessage: null});
  });
});

//....for add in GCP & WTP..........
app.post('/add-data', (req, res) => {
  const {date, tapHole, castNo, length, openTime_1, slag_time, Vendor_Supplier, ClosedTime_1, Duration, ClayPushed, DryOrNot, DrillBitUsed, LancingPipeUsed, PockingRodUsed, hotMetalTemp, C, Si, S, Mn, P, Ti, Sio, Al2O3, CaO, MgQ, FeO, MnO, K20, Na2O, S2, TiO2, B2, B3

  } = req.body;

  // Construct the newData object
  const newData = { date, tapHole, castNo, length, openTime_1, slag_time, Vendor_Supplier, ClosedTime_1, Duration, ClayPushed, DryOrNot, DrillBitUsed, LancingPipeUsed, PockingRodUsed, hotMetalTemp, C, Si, S, Mn, P, Ti, Sio, Al2O3, CaO, MgQ, FeO, MnO, K20, Na2O, S2, TiO2, B2, B3
};
connection.query(
  'SELECT * FROM HOT_METAL_SLAG WHERE date=? AND slag_time=? ',
 [date,slag_time],
 (err, results) => {
if (err) throw err;

if (results.length > 0) {
  console.log("Same data already exists in the database");
  res.render("index", {
    HOT_METAL_SLAG: results,
   duplicateMessage: "Duplicate data already exists in the database.",
  });

}
else{
  connection.query('INSERT INTO HOT_METAL_SLAG SET ?', newData, (err, result) => {
    if (err) throw err;
    console.log('Data added to the database');
   
     res.redirect('/');
     });
    }
   }
  )
 });

//.....for update in EXISTING BLAST FURNACE DATA.....
 app.post('/update-hotMetal', (req, res) => {
  const {id, date, tapHole, castNo, length, openTime_1, slag_time, Vendor_Supplier, ClosedTime_1, Duration, ClayPushed, DryOrNot, DrillBitUsed, LancingPipeUsed, PockingRodUsed, hotMetalTemp, C, Si, S, Mn, P, Ti, Sio, Al2O3, CaO, MgQ, FeO, MnO, K20, Na2O, S2, TiO2, B2, B3

  } = req.body;

  // Construct the newData object
  const updatedData = { date, tapHole, castNo, length, openTime_1, slag_time, Vendor_Supplier, ClosedTime_1, Duration, ClayPushed, DryOrNot, DrillBitUsed, LancingPipeUsed, PockingRodUsed, hotMetalTemp, C, Si, S, Mn, P, Ti, Sio, Al2O3, CaO, MgQ, FeO, MnO, K20, Na2O, S2, TiO2, B2, B3

  };
  connection.query('UPDATE HOT_METAL_SLAG SET ? WHERE id = ?', [updatedData, id], (err, result) => {
    if (err) throw err;
    console.log('Data updated in the database');
    res.redirect('/');
  });
});






// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
