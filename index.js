const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const qs = require("qs")
const { parse } = require("node-html-parser")

const app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);

var io = socketio(server);

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {

    console.log('connected');
    console.log('connected to ' + socket);



    // Initial retrieval and sending of departments to socket
    axios.post('http://172.16.100.34/mis/modules/provisional_ug/action.php', qs.stringify({ 'action': 'programAll' }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(function (response) {
            const parsed = parse(response.data);
            const departments = {};
            parsed.querySelectorAll('option').forEach(
                e => {
                    departments[e.text] = e.attributes['value']
                }
            )
            socket.emit('departments', { 'departments': departments })
        })
        .catch(function (error) {
            console.log(error);
        });



    // Departments request handling
    socket.on('getDepartments', data => {
        axios.post('http://172.16.100.34/mis/modules/provisional_ug/action.php', qs.stringify({ 'action': 'programAll' }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(function (response) {
            const parsed = parse(response.data);
            const departments = {};
            parsed.querySelectorAll('option').forEach(
                e => {
                    departments[e.text] = e.attributes['value']
                }
            )
            socket.emit('departments', { 'departments': departments })
        })
        .catch(function (error) {
            console.log(error);
        });
    })



    // Classes/Sections request handling
    socket.on('getSessions', data => {
        axios.post('http://172.16.100.34/mis/modules/provisional_ug/action.php', qs.stringify({ 'action': 'sessionAll', 'program_id':data }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function (response) {
                const parsed = parse(response.data);
                const sessions = {};
                parsed.querySelectorAll('option').forEach(
                    (e,i) => {
                        if(i!=0)sessions[e.text] = e.attributes['value']
                    }
                )
                socket.emit('sessions', { 'sessions': sessions })
            })
            .catch(function (error) {
                console.log(error);
            });
    })


    // Attendance request handling
    socket.on('getAttendance', data => {

        axios.post('http://172.16.100.34/mis/modules/provisional_ug/action.php', qs.stringify({"action":"fetchAll","attendance_report_id": data+"\\"}), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function (response) {
                const parsed = parse(response.data);
                const subjects = [];
                const subjectsFullName = {};
                const attendanceSubjects = [];
                const classConducted = {};
                const studentAttendances = {};

                const tables = parsed.querySelectorAll('table');

                const subjectCells = [...tables[3].querySelectorAll('td')].slice(3);

                const studentRows = [...parsed.querySelector('tbody').querySelectorAll('tr')];

                for (let i = 0; i < subjectCells.length; i += 2) {
                    subjectsFullName[subjectCells[i].textContent] = subjectCells[i + 1].textContent;
                    subjects.push(subjectCells[i].textContent);
                }

                subjects.reverse();

                const subjectTypes = [...tables[1].querySelectorAll('tr')[1].querySelectorAll('td')];
                const classConductedHTML = [...tables[1].querySelectorAll('tr')[3].querySelectorAll('td')];


                subjectTypes.forEach((e, i) => {
                    attendanceSubjects.push(subjects[subjects.length - 1] + e.innerText.split('.')[1])
                    if (e.nextSibling != null) {
                        if (e.nextSibling.text.includes('Theory') || (e.text.includes('Practical') && e.nextSibling.text.includes('Practical'))) subjects.pop()
                    }
                });

                classConductedHTML.slice(1).forEach((e, i) => classConducted[attendanceSubjects[i]] = e.text);

                studentRows.forEach((row, i) => {
                    if (i % 2 === 0) {
                        const student = row.querySelectorAll('td')[1].textContent;
                        const percentageTD = row.nextElementSibling.querySelectorAll('td')
                        studentAttendances[student] = {};
                        row.querySelectorAll('td').slice(2, attendanceSubjects.length + 2).forEach((e, i) => {
                            studentAttendances[student][attendanceSubjects[i]] = { 'attended': e.textContent, 'percentage': percentageTD[i].textContent };
                        });
                    }
                });

                console.log('sending response');
                socket.emit('response', {
                    'subjectNames':subjectsFullName,
                    'subjects': attendanceSubjects,
                    'conducted': classConducted,
                    'students': studentAttendances
                });
            })
            .catch(function (error) {
                console.log(error);
            });

    });

});


server.listen(port, "0.0.0.0", () => {
    console.log('Server started and running on port ' + port);
})


// anyone here implemented a proxy api something server in js to overcome cors issue with a third party api?