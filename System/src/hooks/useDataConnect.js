import { useState, useEffect } from 'react'
// Note: This is a placeholder for Data Connect SDK integration
// In a real setup, we would use the generated SDK from @firebase/data-connect
// For now, we will simulate the connection or use a mock that fits the schema

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mocking Data Connect response until SDK is fully wired
    const mockEvents = [
      { 
        id: '1', 
        title: 'Seminário de Graduação', 
        type: 'seminar', 
        date: new Date(Date.now() + 86400000 * 5), 
        description: 'Entrega de faixas e graus para alunos aptos.',
        location: 'Matriz'
      },
      { 
        id: '2', 
        title: 'Workshop de Passagem de Guarda', 
        type: 'workshop', 
        date: new Date(Date.now() + 86400000 * 12), 
        description: 'Técnicas avançadas com Prof. Renato.',
        location: 'Filial Sul'
      }
    ]
    
    setEvents(mockEvents)
    setLoading(false)
  }, [])

  return { events, loading }
}

export function useFinance() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockTransactions = [
      { id: '1', studentId: '...', amount: 150, status: 'paid', date: new Date(), category: 'monthly_fee' },
      { id: '2', studentId: '...', amount: 150, status: 'pending', date: new Date(), category: 'monthly_fee' }
    ]
    setTransactions(mockTransactions)
    setLoading(false)
  }, [])

  return { transactions, loading }
}
