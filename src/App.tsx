import React, { useState, useEffect } from 'react'
import './App.css'

interface Task {
  _id: string;
  date: string;
  isChecked: boolean;
}

interface TaskMap {
  [key: number]: Task;
}

const App: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set())
  const [daysInMonth, setDaysInMonth] = useState<(number | null)[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [today] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<TaskMap>({})

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    updateDaysInMonth()
    fetchTasks()
  }, [currentDate])

  const fetchTasks = async () => {
    try {
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(`${apiUrl}/api/tasks?month=${month}&year=${year}`)
      const data = await response.json()
      const taskMap: TaskMap = {}
      setSelectedDays(new Set())
      
      data.forEach((task: Task) => {
        const taskDate = new Date(task.date)
        const dayOfMonth = taskDate.getDate()
        taskMap[dayOfMonth] = task
        if (task.isChecked) {
          setSelectedDays(prev => new Set([...prev, dayOfMonth]))
        }
      })
      setTasks(taskMap)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const updateDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1
    
    const days = Array(firstDayIndex).fill(null)
    for (let i = 1; i <= lastDay; i++) {
      days.push(i)
    }
    setDaysInMonth(days)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setSelectedDays(new Set())
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setSelectedDays(new Set())
  }

  const isCurrentDay = (day: number): boolean => {
    return currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear() &&
           day === today.getDate()
  }

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleString('default', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric' 
    })
  }

  const handleDayClick = async (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const existingTask = tasks[day]
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    if (selectedDays.has(day)) {
      if (window.confirm('Are you sure you want to uncheck this day?')) {
        try {
          if (existingTask) {
            const response = await fetch(`${apiUrl}/api/tasks/${existingTask._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ isChecked: false }),
            })
            if (response.ok) {
              setSelectedDays(prev => {
                const newSelected = new Set(prev)
                newSelected.delete(day)
                return newSelected
              })
            }
          }
        } catch (error) {
          console.error('Error updating task:', error)
        }
      }
    } else {
      try {
        if (existingTask) {
          const response = await fetch(`${apiUrl}/api/tasks/${existingTask._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isChecked: true }),
          })
          if (response.ok) {
            setSelectedDays(prev => new Set([...prev, day]))
          }
        } else {
          const response = await fetch(`${apiUrl}/api/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: date.toISOString(),
              isChecked: true
            }),
          })
          if (response.ok) {
            const newTask = await response.json()
            setTasks(prev => ({
              ...prev,
              [day]: newTask
            }))
            setSelectedDays(prev => new Set([...prev, day]))
          }
        }
      } catch (error) {
        console.error('Error creating/updating task:', error)
      }
    }
  }

  return (
    <div className="app-container">
      <div className="calendar-header">
        <button className="nav-button" onClick={handlePreviousMonth}>←</button>
        <h1>{formatMonthYear(currentDate)}</h1>
        <button className="nav-button" onClick={handleNextMonth}>→</button>
      </div>
      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        {daysInMonth.map((day, index) => (
          <div
            key={index}
            className={`day-tile ${day && selectedDays.has(day) ? 'checked' : ''} ${day && isCurrentDay(day) ? 'current-day' : ''} ${!day ? 'empty-tile' : ''}`}
            onClick={() => day && handleDayClick(day)}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App