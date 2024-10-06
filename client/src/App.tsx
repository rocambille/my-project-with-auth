import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import "./App.css";

type User = {
  id: number;
  email: string;
  password: string;
};

function App() {
  const [user, setUser] = useState(null as User | null);

  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {user == null ? (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          ) : (
            <li>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // Appel à l'API pour demander une déconnexion
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/logout`,
                      {
                        method: "post",
                        credentials: "include",
                      },
                    );

                    // Oubli du user si la déconnexion réussit
                    if (response.status === 200) {
                      setUser(null as User | null);
                    } else {
                      // Log des détails de la réponse en cas d'échec
                      console.info(response);
                    }
                  } catch (err) {
                    // Log des erreurs possibles
                    console.error(err);
                  }
                }}
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
      {user && <p>Hello {user.email}</p>}
      <main>
        <Outlet context={{ user, setUser }} />
      </main>
    </>
  );
}

export default App;
