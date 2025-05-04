import React, { useState, useEffect } from 'react'
import './App.css'

const App = () => {
  const [selectedDays, setSelectedDays] = useState(new Set())
  const [daysInMonth, setDaysInMonth] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [today] = useState(new Date())
  const [tasks, setTasks] = useState({})
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [dateRangeActive, setDateRangeActive] = useState(false)
  const [totalTickedCount, setTotalTickedCount] = useState(0)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    updateDaysInMonth()
    fetchTasks()
  }, [currentDate])

  useEffect(() => {
    if (dateRangeActive && startDate && endDate) {
      fetchDateRangeTasks()
    }
  }, [dateRangeActive, startDate, endDate])

  const fetchDateRangeTasks = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const url = `${apiUrl}/api/tasks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      
      const response = await fetch(url)
      const data = await response.json()
      const tickedCount = data.filter(task => task.isChecked).length
      setTotalTickedCount(tickedCount)
    } catch (error) {
      console.error('Error fetching date range tasks:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()
      const url = `${apiUrl}/api/tasks?month=${month}&year=${year}`
      
      const response = await fetch(url)
      const data = await response.json()
      const taskMap = {}
      setSelectedDays(new Set())
      
      data.forEach(task => {
        const taskDate = new Date(task.date)
        const dayOfMonth = taskDate.getDate()
        taskMap[dayOfMonth] = task
        if (task.isChecked) {
          setSelectedDays(prev => new Set([...prev, dayOfMonth]))
        }
      })
      setTasks(taskMap)
      
      if (!dateRangeActive) {
        setTotalTickedCount(data.filter(task => task.isChecked).length)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const updateDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday, etc.
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    // Convert Sunday-based index (0-6) to Monday-based index (0-6)
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1
    
    // Create array with empty slots for proper day alignment
    const days = Array(firstDayIndex).fill(null)
    for (let i = 1; i <= lastDay; i++) {
      days.push(i)
    }
    setDaysInMonth(days)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setSelectedDays(new Set()) // Clear selections when changing month
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setSelectedDays(new Set()) // Clear selections when changing month
  }

  const isCurrentDay = (day) => {
    return currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear() &&
           day === today.getDate()
  }

  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric' 
    })
  }

  const handleDayClick = async (day) => {
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

  const handleDateRangeSubmit = (e) => {
    e.preventDefault()
    if (startDate && endDate) {
      setDateRangeActive(true)
      fetchDateRangeTasks()
    }
  }

  const resetDateRange = () => {
    setDateRangeActive(false)
    setStartDate(null)
    setEndDate(null)
    setTotalTickedCount(0)
    fetchTasks()
  }

  return (
    <div className="app-container">
      <p>Good Morning Miss Babita... <br /> <span>
        Did you get the milk delivered today?
      </span> </p>
      {/* <hr style={{height:0.1, margin:'20px 0px'}}/> */}
      

      <div className="calendar-header">
        <button className="nav-button" onClick={handlePreviousMonth}>←</button>
        <h3>{today.toLocaleString('default', { 
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric' 
        })}</h3>
        <button className="nav-button" onClick={handleNextMonth}>→</button>
      </div>
      
      <div className="current-month">
        {currentDate.toLocaleString('default', { 
          month: 'long',
          year: 'numeric' 
        })}
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

      <div className="date-range-selector">
        <form  style={{display:'flex', flexDirection:'column', width:'50%', alignItems:"center"}} onSubmit={handleDateRangeSubmit}>
          <input 
            type="date" 
            value={startDate ? startDate.toISOString().split('T')[0] : ''} 
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
          <input 
            type="date" 
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
          <button type="submit">View Range</button>
          {dateRangeActive && (
            <button type="button" onClick={resetDateRange}>Reset</button>
          )}
        </form>
      </div>

      <div className="stats-container">
        <p>Total Milk : {dateRangeActive ? totalTickedCount : selectedDays.size} lt.</p>
        {dateRangeActive && (
          <p className="date-range-info">
            Showing count from {startDate?.toLocaleDateString()} to {endDate?.toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default App