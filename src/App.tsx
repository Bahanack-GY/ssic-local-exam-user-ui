import {Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import ExamQuestions from './pages/ExamQuestions'
import Results from './pages/Results'

function App() {
  return (
    <div className='h-screen w-full '>
     <Routes>
        <Route path='/login' element={<Login/>}/>
        <Route path='/:id' element={<ExamQuestions/>}/>
        <Route path='/results/:id' element={<Results/>}/>
     </Routes>
    </div>
  )
}

export default App;
