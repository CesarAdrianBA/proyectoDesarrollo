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

    function generateForm(columns) {
        console.log(columns)
    
        let formHtml = '<form id="addForm">';
    
        columns.forEach(key => {
            if ( key.toLowerCase == 'id' || key === '_id' || key === 'created_at') return;

            const lowerKey = key.toLowerCase();
            let inputType = 'text';
    
            if (lowerKey.includes('fecha') || lowerKey.includes('date') || lowerKey.includes('nacimiento')) {
                inputType = 'date';
            }
            if (lowerKey.includes('tiempo') || lowerKey.includes('time')) {
                inputType = 'time';
            }
            if (lowerKey.includes('email')) {
                inputType = 'email';
            }
             if (lowerKey.includes('telefono') || lowerKey.includes('cel') || lowerKey.includes('num') || lowerKey.includes('cantidad')) {
                inputType = 'number';
            }

            formHtml += `
                <label class="form-label">${key}</label>
                <input name="${key}" type="${inputType}" ${(key === 'id' || key ==='ID' || key === 'Id' || key=== 'iD' || key === '_id') ? 'disabled' : ''} class="form-control" placeholder="${key}" required/><br/>
            `;
        });
    
        formHtml += `
            <button type="submit" class="btn btn-success">Agregar</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
        </form>
        `;
    
        const modal = document.createElement("div");
        modal.innerHTML = `
            <div class="modal fade show" tabindex="-1" style="display:block; position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0, 0, 0, 0.5);">
                <div class="modal-dialog" style="display: flex; justify-content: center; align-items: center; height: 100%; margin: 0;">
                    <div class="modal-content" style="background:#fff; padding:20px;">
                        <div class="modal-header">
                            <h5 class="modal-title">Agregar Registro</h5>
                            <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                        </div>
                        <div class="modal-body">
                            ${formHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);

        document.getElementById("addForm").addEventListener("submit", async function (e) {
            e.preventDefault();
        
            const formData = new FormData(this);
            const data = {};
            let hasEmpty = false;
        
            formData.forEach((value, key) => {
                if (value.trim() === "") {
                    hasEmpty = true;
                }
        
                // Intenta detectar si es un campo tipo fecha
                const input = this.querySelector(`[name="${key}"]`);
                if (input && input.type === "date") {
                    data[key] = new Date(value); // Convertimos a objeto Date (para MongoDB)
                } else {
                    data[key] = value;
                }
            });
        
            if (hasEmpty) {
                alert("Por favor, completa todos los campos antes de guardar.");
                return;
            }
        
            const selectedDatabase = databaseSelect.value;
            const selectedTable = tableSelect.value;
        
            try {
                const response = await fetch("http://localhost:4000/database/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        database: selectedDatabase,
                        collection: selectedTable,
                        data
                    })
                });
        
                const result = await response.json();
                if (result.success) {
                    alert("Registro agregado correctamente");
                    document.querySelector(".modal")?.remove();
                } else {
                    alert("Error al agregar: " + result.error);
                }
            } catch (error) {
                alert("Fallo la petición: " + error.message);
            }
        });

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


        // Convertir en array si es un solo objeto
        if (results && !Array.isArray(results)) {
            results = [results];
        }
    
        const resultsHeader = document.getElementById("resultsHeader");
        const resultsBody = document.getElementById("resultsBody");
        const options = document.getElementById("options");
    
        resultsHeader.innerHTML = '';
        resultsBody.innerHTML = '';
        options.innerHTML = '';
    
        if (Array.isArray(results) && results.length > 0) {
            const headers = Object.keys(results[0]);
            headers.forEach(header => {
                const th = document.createElement("th");
                th.textContent = header;
                resultsHeader.appendChild(th);
            });

            const actionsTh = document.createElement("th");
            actionsTh.textContent = "Acciones";
            resultsHeader.appendChild(actionsTh);
    
            results.forEach((result, rowIndex) => {
                const tr = document.createElement("tr");
            
                headers.forEach(header => {
                    const td = document.createElement("td");
                    td.textContent = result[header];
                    tr.appendChild(td);
                });
            
                // Crear columna de acciones
                const actionsTd = document.createElement("td");
            
                // Botón Editar
                const editBtn = document.createElement("button");
                editBtn.textContent = "✏️";
                editBtn.classList.add("btn", "btn-sm", "btn-warning", "mx-1");
                editBtn.onclick = () => handleEdit(result);
            
                // Botón Eliminar
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "🗑️";
                deleteBtn.classList.add("btn", "btn-sm", "btn-danger");
                deleteBtn.onclick = async () => handleDelete(result);
            
                // Agrega botones a la celda de acciones
                actionsTd.appendChild(editBtn);
                actionsTd.appendChild(deleteBtn);
            
                // Agrega la celda de acciones a la fila
                tr.appendChild(actionsTd);
                resultsBody.appendChild(tr);
            });   
            const addBtn = document.createElement("button");         
            addBtn.textContent = "Agregar";
            addBtn.classList.add("btn", "btn-sm", "btn-success", "mx-1");
            const columns = Array.from(columnsSelect).map(option => option.value);
            addBtn.onclick = () => generateForm(columns);
            options.appendChild(addBtn);
        } else {
            resultsBody.innerHTML = '<tr><td colspan="100%">No se encontraron resultados.</td></tr>';
        }
    }


    
    
    
    function handleEdit(data) {

        const headers = Object.keys(data);
        const selectedDatabase = databaseSelect.value;
        const selectedTable = tableSelect.value;
    
        let formHtml = '<form id="editForm">';

        headers.forEach(key => {

            if ( key.toLowerCase == 'id' || key === '_id' || key === 'created_at') return;

            const lowerKey = key.toLowerCase();
            let inputType = 'text';
    
            if (lowerKey.includes('fecha') || lowerKey.includes('date') || lowerKey.includes('nacimiento')) {
                inputType = 'date';
            }
            if (lowerKey.includes('tiempo') || lowerKey.includes('time')) {
                inputType = 'time';
            }
            if (lowerKey.includes('email')) {
                inputType = 'email';
            }
             if (lowerKey.includes('telefono') || lowerKey.includes('cel') || lowerKey.includes('num') || lowerKey.includes('cantidad')) {
                inputType = 'number';
            }

            formHtml += `
                <label class="form-label">${key}</label>
                <input name="${key}" type="${inputType}" value="${data[key]}" ${(key === 'id' || key ==='ID' || key === 'Id' || key=== 'iD' || key === '_id') ? 'disabled' : ''} class="form-control"/><br/>
            `;
        });
        formHtml += '<button type="submit" class="btn btn-primary">Guardar</button>';
        formHtml += '<button type="button" class="btn btn-primary" onclick="this.closest(\'.modal\').remove()">Cancelar</button>';
        formHtml += '</form>';
    
        const modal = document.createElement("div");
        modal.innerHTML = `
        <div class="modal fade show" tabindex="-1" style="display:block; position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0, 0, 0, 0.5);">
            <div class="modal-dialog" style="display: flex; justify-content: center; align-items: center; height: 100%; margin: 0;">
                <div class="modal-content" style="background:#fff; padding:20px;">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar Registro</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onclick="this.closest(\'.modal\').remove()"></button>
                    </div>
                    <div class="modal-body">
                        ${formHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    
        document.body.appendChild(modal);
    
        document.getElementById("editForm").onsubmit = async (e) => {
            e.preventDefault();
    
            const formData = new FormData(e.target);
            const newData = {};
            formData.forEach((value, key) => {
                newData[key] = value;
            });
    
            let filter;
            if (selectedDatabase === 'mongodb') {
                filter = { _id: data._id }; // Mongo usa ObjectId en backend
            } else {
                const keys = Object.keys(data);
                const key = keys[0];
                const value = typeof data[key] === "string" ? `'${data[key]}'` : data[key];
                filter = `${key} = ${value}`;
            }
    
            const res = await fetch('http://localhost:4000/database/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedDatabase,
                    selectedTable,
                    filter: selectedDatabase === 'mongodb' ? JSON.stringify(filter) : filter,
                    data: newData
                })
            });
    
            const result = await res.json();
            if (result.success) {
                alert("Registro actualizado correctamente."); 
                modal.remove();
            } else {
                alert("Error al actualizar: " + result.error);
            }
        };
    }
    
    
    async function handleDelete(data) {
        if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
            

        const selectedDatabase = databaseSelect.value;
        const selectedTable = tableSelect.value;
    
            let filter;
    
            if (selectedDatabase === 'mongodb') {
                // En MongoDB usamos JSON y hay que asegurarse de convertir _id si está presente
                filter = {};
                for (let key in data) {
                    if (key === "_id") {
                        // Convierte a ObjectId en backend, por ahora envía como string
                        filter[key] = data[key];
                    } else {
                        filter[key] = data[key];
                    }
                }
            } else {
                // Para SQL y MySQL usamos una condición tipo WHERE
                // Tomamos la primera clave-valor como filtro
                const keys = Object.keys(data);
                if (keys.length > 0) {
                    const key = keys[0];
                    const value = typeof data[key] === "string" ? `'${data[key]}'` : data[key];
                    filter = `${key} = ${value}`;
                } else {
                    alert("No se puede eliminar el registro sin identificarlo.");
                    return;
                }
            }
    
            const res = await fetch('http://localhost:4000/database/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedDatabase,
                    selectedTable,
                    filter: selectedDatabase === 'mongodb' ? JSON.stringify(filter) : filter
                })
            });
    
            const result = await res.json();
    
            if (result.success) {
                alert("Registro eliminado exitosamente.");
            } else {
                alert("Error al eliminar: " + result.error);
            }
        }
    }
    
    
});
