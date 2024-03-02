import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import UserProvider from './context/UserProvider.tsx'
import PostProvider from './context/PostProvider.tsx'
import StoryProvider from './context/StoryProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <UserProvider>
    <PostProvider>
      <StoryProvider>
        <App />
      </StoryProvider>
    </PostProvider>
  </UserProvider>
)
