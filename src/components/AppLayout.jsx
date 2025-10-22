import { Outlet } from 'react-router-dom'

const AppLayout = () => (
  <div className="page">
    <header className="top-bar">
      <div className="brand">LexWord</div>
      <button className="profile-button" type="button">
        <span className="profile-avatar">J</span>
        <span className="profile-name">Jackson</span>
      </button>
    </header>

    <main className="content">
      <Outlet />
    </main>
  </div>
)

export default AppLayout
