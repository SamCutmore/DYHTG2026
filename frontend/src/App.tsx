import gutsLogo from './assets/guts.png'
import './App.css'

const stack = [
  { name: 'Spring', href: 'https://spring.io/projects/spring-boot', icon: '/tech/springboot.svg' },
  { name: 'React', href: 'https://react.dev/', icon: '/tech/react.svg' },
  { name: 'PostgreSQL', href: 'https://www.postgresql.org/', icon: '/tech/postgresql.svg' },
  { name: 'pgAdmin', href: 'https://www.pgadmin.org/', icon: '/tech/pgadmin.svg' },
  { name: 'nginx', href: 'https://nginx.org/', icon: '/tech/nginx.svg' },
  { name: 'Nexus', href: 'https://www.sonatype.com/products/sonatype-nexus-repository', icon: '/tech/sonatype.svg' },
  { name: 'Docker', href: 'https://www.docker.com/', icon: '/tech/docker.svg' },
  { name: 'Vite', href: 'https://vite.dev/', icon: '/tech/vite.svg' },
  { name: 'GitHub', href: 'https://github.com/SamCutmore/DYHTG2026', icon: '/tech/github.svg' },
] as const

function App() {
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={gutsLogo} className="base" width="170" height="179" alt="" />
        </div>
        <div>
          <h1>DYHTG Hackathon Start</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Tech Stack Documentation</h2>
          <ul>
            {stack.map((item) => (
              <li key={item.name}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <img className="button-icon" src={item.icon} alt="" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
