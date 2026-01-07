const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function test() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'admin'
        });
        const { token } = loginRes.data;
        console.log("Login successful, token:", token.substring(0, 10) + "...");

        // 2. Create Student
        console.log("Creating student...");
        const studentData = {
            nombre: "Test Student Script",
            grado: "3 años",
            mensualidad: 200,
            seccionId: "B" // Testing the seccion mapping too
        };

        const createRes = await axios.post(`${API_URL}/estudiantes`, studentData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Student created:", createRes.data);
    } catch (error) {
        console.error("Error creating student:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

test();
