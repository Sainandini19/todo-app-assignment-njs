const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const format = require("date-fns/format");

const isMatch = require("date-fns/isMatch");

const isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("the server running at http://locaalhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertDataIntoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};
// API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  let data = null;
  let getTodosQuery = "";

  switch (true) {
    // Scenario 1
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const getTodosQuery = `
                SELECT * FROM todo 
                WHERE status = '${status}' 
                `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachData) => convertDataIntoResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    // Scenario 2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const getTodosQuery = `
                SELECT * FROM todo 
                WHERE priority = '${priority}' 
                `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachData) => convertDataIntoResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // Scenario 3
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const getTodosQuery = `
                SELECT * FROM todo 
                WHERE priority = '${priority}' AND status = '${status}' 
                `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachData) => convertDataIntoResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // Scenario 4
    case hasSearchProperty(request.query):
      const getTodosQuery = `
                SELECT * FROM todo 
                WHERE todo LIKE '%${search_q}%' 
                `;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachData) => convertDataIntoResponseObject(eachData))
      );

      break;
    // Scenario 5
    case hasCategoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const getTodosQuery = `
                SELECT * FROM todo 
                WHERE category = '${category}' AND status = '${status}' 
                `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachData) => convertDataIntoResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    // Scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const getTodosQuery = `
                SELECT * FROM todo 
                WHERE  category = '${category}' 
                `;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachData) => convertDataIntoResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 7

    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          const getTodosQuery = `
                SELECT * FROM todo 
                WHERE category = '${category}' AND priority = '${priority}' 
                `;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachData) => convertDataIntoResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `SELECT * FROM todo`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachData) => convertDataIntoResponseObject(eachData))
      );

      break;
  }
});
//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id = '${todoId}'
    `;
  const dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});
//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dbResponse = await db.all(getDateQuery);
    response.send(
      dbResponse.map((eachData) => convertDataIntoResponseObject(eachData))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `
                   INSERT INTO
                   todo(id,todo , priority,status,category,due_date)
                   VALUES( ${id}, '${todo}', '${priority}' , '${status}' , '${category}', '${newDueDate}')
                  `;
          await db.run(postQuery);
          response.send("Todo Successfully Add");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";
  const requestBody = request.body;

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id=${todoId}
  `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = previousTodo;

  let updateTodo;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `UPDATE todo
            SET  
            todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
             WHERE  id = ${todoId}  
            `;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `UPDATE todo
            SET  
            todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
             WHERE  id = ${todoId}  
            `;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.todo !== undefined:
      updateTodo = `UPDATE todo
            SET  
            todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
             WHERE  id = ${todoId}  
            `;
      await db.run(updateTodo);
      response.send("Todo Updated");

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `UPDATE todo
            SET  
            todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
             WHERE  id = ${todoId}  
            `;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Category Priority");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `UPDATE todo
            SET  
            todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
             WHERE  id = ${todoId}  
            `;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});
// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM todo 
    WHERE id = ${todoId}
  `;

  await db.run(deleteTodoQuery);
  response.send("Todo Delete");
});

module.exports = app;
