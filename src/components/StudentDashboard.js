import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { GlobalStateContext } from '../context/GlobalStateContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, Trophy } from 'lucide-react';

const StudentDashboard = () => {
  const { students, transactions } = useContext(GlobalStateContext);
  const { id } = useParams();
  const [selectedStudentId, setSelectedStudentId] = useState(id || '');
  const [student, setStudent] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [homework, setHomework] = useState([]);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (selectedStudentId) {
      const foundStudent = students.find(s => s.name.toLowerCase() === selectedStudentId.toLowerCase());
      if (foundStudent) {
        setStudent(foundStudent);
        
        // Filter transactions for this student
        const studentTransactions = transactions.filter(t => t.category === foundStudent.name);
        
        // Set completed lessons
        const completedLessons = studentTransactions.filter(t => t.type === 'lesson').map(lesson => ({
          date: lesson.date,
          description: lesson.description,
          subject: lesson.subject
        }));
        setCompletedLessons(completedLessons);
        
        // TODO: Fetch planned lessons, homework, and goals from your backend
        setPlannedLessons([
          { date: '2024-09-20', topic: 'Advanced Grammar' },
          { date: '2024-09-27', topic: 'Essay Writing' },
        ]);
        setHomework([
          { id: 1, topic: 'Verb Tenses', dueDate: '2024-09-18', completed: false, score: null },
          { id: 2, topic: 'Reading Comprehension', dueDate: '2024-09-25', completed: true, score: 85 },
        ]);
        setGoals(['Improve speaking fluency', 'Master irregular verbs']);
      }
    }
  }, [selectedStudentId, students, transactions]);

  const handleAddGoal = () => {
    if (newGoal.trim() !== '') {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
      // TODO: Save new goal to backend
    }
  };

  const handleToggleHomework = (id) => {
    setHomework(homework.map(hw => 
      hw.id === id ? { ...hw, completed: !hw.completed } : hw
    ));
    // TODO: Update homework status in backend
  };

  if (!student) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Select a Student</h1>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded"
        >
          <option value="">Select a student</option>
          {students.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const totalPaidLessons = transactions
    .filter(t => t.category === student.name && t.type === 'income')
    .reduce((sum, payment) => sum + (payment.amount / student.price), 0);
  
  const remainingLessons = totalPaidLessons - completedLessons.length;

  const barData = {
    labels: ['Lessons'],
    datasets: [
      {
        label: 'Remaining Lessons',
        data: [remainingLessons],
        backgroundColor: '#4caf50',
      },
      {
        label: 'Completed Lessons',
        data: [completedLessons.length],
        backgroundColor: '#2196f3',
      },
    ],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{student.name}'s Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={barData} options={barOptions} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {goals.map((goal, index) => (
                <li key={index} className="flex items-center">
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
            <div className="flex mt-4">
              <Input
                type="text"
                placeholder="Add a new goal"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="mr-2"
              />
              <Button onClick={handleAddGoal}>Add</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="completed" className="mb-6">
        <TabsList>
          <TabsTrigger value="completed">Completed Lessons</TabsTrigger>
          <TabsTrigger value="planned">Planned Lessons</TabsTrigger>
        </TabsList>
        <TabsContent value="completed">
          <Card>
            <CardContent>
              <ul className="space-y-2">
                {completedLessons.map((lesson, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    <span>{lesson.date}: {lesson.description} ({lesson.subject})</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="planned">
          <Card>
            <CardContent>
              <ul className="space-y-2">
                {plannedLessons.map((lesson, index) => (
                  <li key={index} className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                    <span>{lesson.date}: {lesson.topic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {homework.map((hw) => (
              <li key={hw.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox
                    id={`homework-${hw.id}`}
                    checked={hw.completed}
                    onCheckedChange={() => handleToggleHomework(hw.id)}
                  />
                  <label htmlFor={`homework-${hw.id}`} className="ml-2">
                    {hw.topic} (Due: {hw.dueDate})
                  </label>
                </div>
                {hw.completed && hw.score !== null && (
                  <span className="text-green-500">Score: {hw.score}%</span>
                )}
                {!hw.completed && new Date(hw.dueDate) < new Date() && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;