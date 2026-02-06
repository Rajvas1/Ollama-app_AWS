from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel




class Employee(BaseModel):
    id: int
    name: str
    department: str
    age: int

employees_db: List[Employee] = []

app = FastAPI()


@app.get('/employees',response_model=List[Employee])
def get_employees():
    return employees_db


@app.get('/employees/{emp_id}',response_model=Employee)
def get_employee(emp_id: int):
    for index, employee in enumerate(employees_db):
        if employee.id == emp_id:
            return employees_db[index]
    raise HTTPException(status_code=404, detail="Employee Not Found")

@app.post('/employees')
def add_employee(new_emp: Employee):
    for employee in employees_db:
        if employee == new_emp.id:
            raise HTTPException(status_code=400, detail="Employee already exists")
    employees_db.append(new_emp)
    return new_emp

@app.put('/employees/{emp_id}',response_model=Employee)
def update_employee(emp_id: int, update_employee: Employee):
    for index, employee in enumerate(employees_db):
        if employee.id == emp_id:
            employees_db[index] = update_employee
            return update_employee
    raise HTTPException(status_code=404, detail="Employee Not Found")

@app.delete('/update_employee/{emp_id}')
def delete_employee(emp_id: int):
    for i, employee in enumerate(employees_db):
        if employee.id == emp_id:
            del employees_db[i]
            return {"message":"Employee deleted succesfully"}
    raise HTTPException(status_code=404, detail="Employee Not Found")