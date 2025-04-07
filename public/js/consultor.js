document.addEventListener("DOMContentLoaded", () => {
    const guiForm = document.getElementById("guiForm");
    const databaseSelect = document.getElementById("database");
    const tableSelect = document.getElementById("tableSelect");
    const columnsSelect = document.getElementById("columns");
    const filterInput = document.getElementById("filter");

    // Función para obtener las tablas de la base de datos seleccionada
    async function getTables(database) {
        try {
            const response = await fetch("http://localhost:4000/database/schema", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ database })
            });

            const data = await response.json();
            if (data.success) {
                // Limpiar las opciones de tabla y agregar las nuevas
                tableSelect.innerHTML = '<option selected disabled>Selecciona una tabla</option>';
                data.schema.forEach(table => {
                    const option = document.createElement("option");
                    option.value = table;
                    option.textContent = table;
                    tableSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error al obtener tablas:", error);
        }
    }

    // Función para obtener las columnas de la tabla seleccionada
    async function getColumns(database, tableOrCollection) {
        try {
            const response = await fetch("http://localhost:4000/database/columns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ database, tableOrCollection })
            });

            const data = await response.json();
            if (data.success) {
                // Limpiar las opciones de columnas y agregar las nuevas
                columnsSelect.innerHTML = '';
                data.columns.forEach(column => {
                    const option = document.createElement("option");
                    option.value = column;
                    option.textContent = column;
                    columnsSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error al obtener columnas:", error);
        }
    }

    // Manejar la selección de base de datos
    databaseSelect.addEventListener("change", (e) => {
        const selectedDatabase = e.target.value;
        getTables(selectedDatabase); // Obtener las tablas de la base de datos seleccionada
    });

    // Manejar la selección de tabla
    tableSelect.addEventListener("change", (e) => {
        const selectedDatabase = databaseSelect.value;
        const selectedTable = e.target.value;
        if (selectedDatabase && selectedTable) {
            getColumns(selectedDatabase, selectedTable); // Obtener las columnas de la tabla seleccionada
        }
    });

    // Ejecutar la consulta cuando se envíe el formulario
    guiForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const database = databaseSelect.value;
        const tableOrCollection = tableSelect.value;
        const columns = Array.from(columnsSelect.selectedOptions).map(option => option.value);
        const filter = filterInput.value;

        if (!tableOrCollection) {
            alert("Por favor, selecciona una tabla.");
            return;
        }

        // Construir la consulta que se enviará al backend
        const query = {
            database,
            collection: tableOrCollection,
            columns: columns.join(", "), 
            filter
        };

        try {
            const response = await fetch("http://localhost:4000/database/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(query)
            });

            const data = await response.json();
            if (data.success) {
                displayResults(data.results);
            } else {
                alert(data.error || "No se pudo ejecutar la consulta.");
            }
        } catch (error) {
            console.error("Error al ejecutar la consulta:", error);
        }
    });

    // Función para mostrar los resultados de la consulta
    async function displayResults(results) {
        console.log("Resultados a imprimir:", results);
    
        // 🔧 Convertir en array si es un solo objeto
        if (results && !Array.isArray(results)) {
            results = [results];
        }
    
        const resultsHeader = document.getElementById("resultsHeader");
        const resultsBody = document.getElementById("resultsBody");
    
        resultsHeader.innerHTML = '';
        resultsBody.innerHTML = '';
    
        if (Array.isArray(results) && results.length > 0) {
            const headers = Object.keys(results[0]);
            headers.forEach(header => {
                const th = document.createElement("th");
                th.textContent = header;
                resultsHeader.appendChild(th);
            });
    
            results.forEach(result => {
                const tr = document.createElement("tr");
                headers.forEach(header => {
                    const td = document.createElement("td");
                    td.textContent = result[header];
                    tr.appendChild(td);
                });
                resultsBody.appendChild(tr);
            });
        } else {
            resultsBody.innerHTML = '<tr><td colspan="100%">No se encontraron resultados.</td></tr>';
        }
    }
    
    
});
